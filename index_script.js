import init, { encrypt_file, create_rsa, Keys, encrypt_aes_key, decrypt_file, encrypt_args, encrypt_rsa_args, decrypt_rsa_args, decrypt_aes_key} from "./pkg/rust.js";

function docReady(fn) {
    // see if DOM is already available
    if (document.readyState === "complete" || document.readyState === "interactive") {
        // call on next available tick
        setTimeout(fn, 1);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

docReady(function() {
    // DOM is loaded and ready for manipulation here



  const runWasm = async () => {
    //rust test
    var c = await init("./pkg/rust_bg.wasm");
    var result = c.compute(7, 7);

    if($('#key_generator').length){
    var keys_created = false;
    // generates rsa keypair and a public key password
    async function generate_keys(){
        if(keys_created === false){
            document.getElementById('generate_keys').innerHTML = '<img style="width:20px; height:20px;" src="loading.gif">';
            //rust function to generate keypair and pub key password
            var keys = await create_rsa();
            //saves pub key and password to database
            $.ajax({
                        type: 'GET',
                        cache: false,
                        data:{
                        public_key: '' + keys.public,
                        pub_key_password: '' + keys.key_password},
                        url: 'http://localhost:8080/post_pub_key_to_db',
                        success: function(result){
                            document.getElementById('generate_keys').innerHTML = 'Generate Keys!'
                        }
                    });
            //binds keypair and password to textareas
            document.getElementById('public_key').innerHTML = keys.public;
            document.getElementById('private_key').innerHTML = keys.private;
            document.getElementById('pub_key_password').innerHTML = keys.key_password;
            keys_created = true;

        }

    }

    document.getElementById('generate_keys').addEventListener('click', generate_keys);

    }


    if($('#upload_site').length){

    document.getElementById('file-input').addEventListener('change', readFileAsByteArray);
    document.getElementById('remove-file').addEventListener('click', removeUpload);
    var array = [];
    var file_type;
    var file_name;
    var file_size;
//on file input creates a byte array from file
function readFileAsByteArray() {
    if (this.files && this.files[0]) {
    var files = this.files;
    if (files.length === 0) {
        console.log('No file is selected');
        return;
    }
    file_type = files[0].type;
    file_name = files[0].name;
    file_size = files[0].size;
    var reader = new FileReader();
    reader.onload = async function(event) {
      $('.file-upload-wrap').hide();

      $('.file-upload-content').show();

      $('.file-title').html(files[0].name);

        var contents =  event.target.result;
        //array contains file as byte array
        array = new Uint8Array(contents);

    };
    reader.readAsArrayBuffer(files[0]);
}else{
    removeUpload();
}
}
//changes css on file remove by user
function removeUpload() {
  document.getElementById("file-input").value = "";
  $('.file-upload-content').hide();
  $('.file-upload-wrap').show();
  array = [];
}
$('.file-upload-wrap').bind('dragover', function () {
    $('.file-upload-wrap').addClass('file-dropping');
  });
  $('.file-upload-wrap').bind('dragleave', function () {
    $('.file-upload-wrap').removeClass('file-dropping');
});







document.getElementById('upload_button').addEventListener('click', fileUpload);
//uploads file to server
async function fileUpload(){
            var key_or_password = document.getElementById('key').value;
            if(key_or_password.length == 0 || array.length == 0 || array === undefined) return;
            document.getElementById('upload_button').removeEventListener('click', fileUpload);
            document.getElementById('upload_button').innerHTML = '<img style="width:20px; height:20px;" src="loading.gif">';

            var password_public_key;
            var save_password;
            //checks password or public key before upload
            if(key_or_password.length == 12){
                 await $.ajax({
                          type: 'GET',
                          cache: false,
                          data:{
                          password: '' + key_or_password},
                          url: 'http://localhost:8080/get_key',
                          success: function(result){
                              if(result.length == 0) {
                              alert("Wrong public key password!");
                              document.getElementById('upload_button').innerHTML = 'Upload File!'
                              document.getElementById('upload_button').addEventListener('click', fileUpload);
                                return;
                              }
                              password_public_key = result[0].public_key;
                          }
                      });
                      save_password = key_or_password;
            }else if(key_or_password.length > 400 && key_or_password.length < 433){
                password_public_key = key_or_password;

            }else{
                alert("Please input a public key password or a public key!");
                document.getElementById('upload_button').innerHTML = 'Upload File!'
                document.getElementById('upload_button').addEventListener('click', fileUpload);
                return;
            }

            if(password_public_key === undefined)return;
            //rust file encryption aes
            var file_encrypt = await encrypt_file(array);
            try{
            //rust aes key encryption via rsa public key
            var file_key_rsa = encrypt_aes_key(password_public_key, file_encrypt.key);
            }catch(e){
                alert("Wrong public key format!");
                document.getElementById('upload_button').innerHTML = 'Upload File!'
                document.getElementById('upload_button').addEventListener('click', fileUpload);
                return;

            }

            //creates file and aes key file from encrypted byte arrays
            var blob = new Blob([file_encrypt.file]);
            var file = new File([blob], ""+file_encrypt.file_link );
            var blob_key = new Blob([file_key_rsa.encrypted_aes_key]);
            var file_key = new File([blob_key], ""+file_encrypt.file_link+"_key")

             var form_data = new FormData();
              form_data.append('upload_file', file);
              form_data.append('key', file_key);
              form_data.append('nonce', file_encrypt.nonce);
              form_data.append('file_type', file_type);
              form_data.append('file_name', file_name);
              form_data.append('file_size', file_size);
              form_data.append('rsa_pub_key', password_public_key);
              form_data.append('file_name_encrypted', file_encrypt.file_link);
              form_data.append('rsa_pub_key_password', save_password);


                    //sends encrypted file, encrypted key and meta data to server
                    $.ajax({
                            url: 'http://localhost:8080/upload', // <-- point to server-side PHP script
                            dataType: 'text',  // <-- what to expect back from the PHP script, if anything
                            cache: false,
                            contentType: false,
                            processData: false,
                            data: form_data,
                            type: 'post',
                            success: function(result){
                                document.getElementById('upload_button').innerHTML = 'Upload File!'
                                document.getElementById('upload_button').addEventListener('click', fileUpload);
                            }
                         });

                         //creates download link and outputs it to user
                         document.getElementById('download_link').innerHTML = ''+window.location.href+ 'download_'+file_encrypt.file_link;
                         document.getElementById('download_link').href = ''+window.location.href+ 'download_'+file_encrypt.file_link;
                         document.getElementById('dwn_link').style.display = "block"
                         removeUpload();
}

}

if($('#download_site').length){
document.getElementById('download').addEventListener('click', fileDownload);
//file download function
async function fileDownload(){
    if(document.getElementById('private_key').length == 0)return;
    document.getElementById('download').removeEventListener('click', fileDownload);
    var enc_file_name = ""+window.location.href;
        enc_file_name = enc_file_name.replace("http://localhost:8080/download_","");
        enc_file_name = enc_file_name.replace("http://localhost:8080/download","");
    var final_file_name = enc_file_name;
    var file;
    var file_meta_data;
    var aes_key;

//gets binary file from server as array buffer and creates a byte array
 await   axios({
        url:'http://localhost:8080/d_file',
        method:'GET',
        responseType:'arraybuffer',
        params:{
         file_name: ''+final_file_name}
    }).then((res)=>{
        var bytearray = new Uint8Array(res.data);
        file = bytearray;

    })

        //gets encrypted aes key as byte array from server
        await $.ajax({
                    type: 'GET',
                    cache: false,
                    data:{
                    file_name: ''+final_file_name},
                    url: 'http://localhost:8080/d_key',
                    success: function(result){
                        aes_key = result.file.data;
                    }
                });
        //gets meta data of the downloaded file from server
        await $.ajax({
                        type: 'GET',
                        cache: false,
                        data:{
                        file_name: ''+final_file_name},
                        url: 'http://localhost:8080/file_meta_data',
                        success: function(result){
                           file_meta_data = result[0];
                        }
                    });
            var private_key = document.getElementById('private_key').value;

            try{
                //rust function to decrypt aes key
                var file_key_rsa_decrypted = await decrypt_aes_key(private_key, aes_key, file_meta_data.aes_nonce);
            }catch(e){
                alert("Wrong private key or wrong private key format!");
                document.getElementById('download').addEventListener('click', fileDownload);
                return;
            }
            //rust function to decrypt file
            var file_decrypt = await decrypt_file(file, file_key_rsa_decrypted.decrypted_aes_key, file_meta_data.aes_nonce);
              //binds the decrypted file to <a> element for download from user
              var a = document.getElementById("a");
              var blob = new Blob([file_decrypt], {type: file_meta_data.file_type});
              var file = new File([blob], ""+file_meta_data.file_name, {type: file_meta_data.file_type});
              a.href = URL.createObjectURL(file);
              a.download = ""+file_meta_data.file_name;
              a.style = "display:block;";

}
}

  };
    runWasm();

});