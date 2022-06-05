import init, { encrypt_file, create_rsa, Keys, encrypt_aes_key, decrypt_file, encrypt_args, encrypt_rsa_args, decrypt_rsa_args, decrypt_aes_key} from "./pkg/rust.js";

function jq(){
        $.ajax({
            type: 'GET',
            cache: false,
            data: '123',
            url: 'http://localhost:8080/public',
            success: function(result){
                console.log(result);
            }
        });
}

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

            document.getElementById('public_key').value = keys.public;
            document.getElementById('private_key').value = keys.private;
            document.getElementById('pub_key_password').value = keys.key_password;
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
document.getElementById('test').addEventListener('click', fileUpload);
async function fileUpload(){

            var file_encrypt = encrypt_file(array);
            console.log(file_encrypt.file, file_encrypt.key, file_encrypt.nonce, file_encrypt.file_link);

            var hard_public_key = '-----BEGIN RSA PUBLIC KEY-----\n'+
                                   'MIIBCgKCAQEAyoDLJ1m16A4+edExwa/EjBz3KSpZXJVQy0f6Zt3q3D0BcG+tpWag\n'+
                                   'ODffsh0IBBhYsz+mdMeQISxDVLbpf/K/MqY1AQKH7FIIE2usMSlQjHvoBIwdexTQ\n'+
                                   'AUMstTXhTBLSyPT0tt57Itg3kJz4EWD6g/NhxxAHuFCVTBcZubQKobsiQ9AdMNqM\n'+
                                   'ceHLweuk1VjbgRE38uYBply8LOypr8moAo7hL3Njz6MDpXuJ2A8jic66qk6kVqWN\n'+
                                   'AL3ZF6gNgEAvw1bZk91ySOUx/otemg68Uo4sFfIubRDWbEMeExUa6k6JgJEXcDf4\n'+
                                   'b7xFQLxcNXPOSGdCIuHUiAOUIqBjt9M0IwIDAQAB\n'+
                                   '-----END RSA PUBLIC KEY-----'

            var file_key_rsa = encrypt_aes_key(hard_public_key, file_encrypt.key, file_encrypt.nonce);

            console.log(file_key_rsa.encrypted_aes_key, file_key_rsa.encrypted_aes_nonce);
            var blob = new Blob([file_encrypt.file]);
            var file = new File([blob], ""+file_encrypt.file_link );
            var blob_key = new Blob([file_key_rsa.encrypted_aes_key]);
            var blob_nonce = new Blob([file_key_rsa.encrypted_aes_nonce]);

             var form_data = new FormData();
              form_data.append('upload_file', file);
              form_data.append('key', blob_key);
              form_data.append('nonce', blob_nonce);

                    $.ajax({
                            url: 'http://localhost:8080/upload', // <-- point to server-side PHP script
                            dataType: 'text',  // <-- what to expect back from the PHP script, if anything
                            cache: false,
                            contentType: false,
                            processData: false,
                            data: form_data,
                            type: 'post'
                         });




           //var cons = create_rsa();
            /*var file_key_rsa = encrypt_aes_key(hard_public_key, file_encrypt.key, file_encrypt.nonce);
            console.log(file_key_rsa.encrypted_aes_key, file_key_rsa.encrypted_aes_nonce);

             var file_key_rsa_decrypted = decrypt_aes_key(cons.private, file_key_rsa.encrypted_aes_key, file_key_rsa.encrypted_aes_nonce );
            console.log(file_key_rsa_decrypted.decrypted_aes_key, file_key_rsa_decrypted.decrypted_aes_nonce);

            var file_decrypt = decrypt_file(file_encrypt.file, file_key_rsa_decrypted.decrypted_aes_key, file_key_rsa_decrypted.decrypted_aes_nonce);
            console.log(file_decrypt);*/


            //console.log(contents);
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