import init, { encrypt_file, create_rsa, Keys, encrypt_aes_key, decrypt_file, encrypt_args, encrypt_rsa_args, decrypt_rsa_args, decrypt_aes_key} from "./pkg/rust.js";

/*function jq(){
        $.ajax({
            type: 'GET',
            cache: false,
            data: '123',
            url: 'http://localhost:8080/public',
            success: function(result){
                console.log(result);
            }
        });
}*/

        //document.getElementById('btn2').addEventListener('click', jq);



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
    var c = await init("./pkg/rust_bg.wasm");
    var result = c.compute(7, 7);
    if($('#key_generator').length){
    var keys_created = false;

    async function generate_keys(){
        if(keys_created === false){
            var keys = await create_rsa();

            $.ajax({
                        type: 'GET',
                        cache: false,
                        data:{
                        public_key: '' + keys.public,
                        pub_key_password: '' + keys.key_password},
                        url: 'http://localhost:8080/post_pub_key_to_db',
                        success: function(result){
                            console.log(result);
                        }
                    });

            document.getElementById('public_key').innerHTML = keys.public;
            document.getElementById('private_key').innerHTML = keys.private;
            document.getElementById('pub_key_password').innerHTML = keys.key_password;
            keys_created = true;

        }

    }

    document.getElementById('generate_keys').addEventListener('click', generate_keys);

    }
    console.log(result);
    //document.body.textContent = result;
    if($('#upload_site').length){
    document.getElementById('file-input').addEventListener('change', readFileAsByteArray);
    var array;
    var file_type;
    var file_name;
    var file_size;
function readFileAsByteArray() {
    var files = this.files;
    if (files.length === 0) {
        console.log('No file is selected');
        return;
    }
    file_type = files[0].type;
    file_name = files[0].name;
    file_size = files[0].size;
    console.log(files[0]);
    var reader = new FileReader();
    reader.onload = async function(event) {
        var contents =  event.target.result;
        array = new Uint8Array(contents);
        console.log(array);

    };
    reader.readAsArrayBuffer(files[0]);

    //console.log(files[0]);
}
document.getElementById('upload_button').addEventListener('click', fileUpload);
async function fileUpload(){
            var key_or_password = document.getElementById('key').value;
            if(key_or_password.length == 0) return;

            var file_encrypt = await encrypt_file(array);
            console.log(file_encrypt.file, file_encrypt.key, file_encrypt.nonce, file_encrypt.file_link);
            var password_public_key;
            var save_password;
            if(key_or_password.length == 12){
                 await $.ajax({
                          type: 'GET',
                          cache: false,
                          data:{
                          password: '' + key_or_password},
                          url: 'http://localhost:8080/get_key',
                          success: function(result){
                              password_public_key = result[0].public_key;
                          }
                      });
                      save_password = key_or_password;
            }else if(key_or_password.length > 400 && key_or_password.length < 433){
                password_public_key = key_or_password;

            }else{
                return;
            }

            var file_key_rsa = encrypt_aes_key(password_public_key, file_encrypt.key);

            console.log(file_key_rsa.encrypted_aes_key);
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



                    $.ajax({
                            url: 'http://localhost:8080/upload', // <-- point to server-side PHP script
                            dataType: 'text',  // <-- what to expect back from the PHP script, if anything
                            cache: false,
                            contentType: false,
                            processData: false,
                            data: form_data,
                            type: 'post',
                            success: function(result){
                                console.log(result);
                            }
                         });

                         file_encrypt.file_link
                         //ocument.getElementById('download_link').href = '/download_'+file_encrypt.file_link;
                         document.getElementById('download_link').value = ''+window.location.href+ 'download_'+file_encrypt.file_link;
}

}

if($('#download_site').length){
document.getElementById('download').addEventListener('click', fileDownload);

async function fileDownload(){
    if(document.getElementById('private_key').length == 0)return;
    var enc_file_name = ""+window.location.href;
    var final_file_name = enc_file_name.replace("http://localhost:8080/download_","");
    var file;
    var file_meta_data;
    var aes_key;


 await   axios({
        url:'http://localhost:8080/d_file',
        method:'GET',
        responseType:'arraybuffer',
        params:{
         file_name: ''+final_file_name}
    }).then((res)=>{
        //console.log(res);
        var bytearray = new Uint8Array(res.data);
        file = bytearray;
        //console.log(bytearray)

    })

  /* await $.ajax({
            type: 'GET',
            //responseType: 'blob',
            cache: false,
            data:{
            file_name: ''+final_file_name},
            url: 'http://localhost:8080/d_file',
            success: function(result){

                    console.log(result);


                 var blob = new Blob([result])
                  var file = new File([blob], "test")
                  var reader = new FileReader();
                    console.log(file);
                   reader.onload = async function(event) {
                          var contents =  event.target.result;
                              array = [];
                              array = new Uint8Array(contents);
                              file = array;
                      };
                  reader.readAsArrayBuffer(file);

                  //file = array;

                  //file = result.file.data;
            }
        });*/

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
        console.log(file_meta_data);
            var private_key = document.getElementById('private_key').value;


           var file_key_rsa_decrypted = await decrypt_aes_key(private_key, aes_key, file_meta_data.aes_nonce);
            console.log(file_key_rsa_decrypted.decrypted_aes_key);

            var file_decrypt = await decrypt_file(file, file_key_rsa_decrypted.decrypted_aes_key, file_meta_data.aes_nonce);
            console.log(file_decrypt);

              var a = document.getElementById("a");
              var blob = new Blob([file_decrypt], {type: file_meta_data.file_type});
              var file = new File([blob], ""+file_meta_data.file_name, {type: file_meta_data.file_type});
              a.href = URL.createObjectURL(file);
              a.download = ""+file_meta_data.file_name;


            /*document.getElementById('btn').addEventListener('click', download(array, 'test_png', files[0].type));

            function download(text, name, type) {
      var a = document.getElementById("a");
      var blob = new Blob([text], {type: type});
      var file = new File([blob], "test", {type: type});
      a.href = URL.createObjectURL(file);
      a.download = name;
    }*/
}
}

  };
    runWasm();

});