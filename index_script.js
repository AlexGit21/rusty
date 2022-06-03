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

        document.getElementById('btn2').addEventListener('click', jq);



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

    console.log(result);
    //document.body.textContent = result;

    document.getElementById('file-input').addEventListener('change', readFileAsString);
function readFileAsString() {
    var files = this.files;
    if (files.length === 0) {
        console.log('No file is selected');
        return;
    }
    console.log(files[0]);
    var reader = new FileReader();
    reader.onload = async function(event) {
        var contents =  event.target.result;
        var array = new Uint8Array(contents);
        console.log(array);
        var file_encrypt = encrypt_file(array);
        console.log(file_encrypt.file, file_encrypt.key, file_encrypt.nonce);
        var blob = new Blob([file_encrypt.file]);
        var file = new File([blob], "dsl332fkd1wer523dsk" );


        var cons = create_rsa();
        var file_key_rsa = encrypt_aes_key(cons.public, file_encrypt.key, file_encrypt.nonce);
        console.log(file_key_rsa.encrypted_aes_key, file_key_rsa.encrypted_aes_nonce);

        var file_key_rsa_decrypted = decrypt_aes_key(cons.private, file_key_rsa.encrypted_aes_key, file_key_rsa.encrypted_aes_nonce );
        console.log(file_key_rsa_decrypted.decrypted_aes_key, file_key_rsa_decrypted.decrypted_aes_nonce);

        var file_decrypt = decrypt_file(file_encrypt.file, file_key_rsa_decrypted.decrypted_aes_key, file_key_rsa_decrypted.decrypted_aes_nonce);
        console.log(file_decrypt);


        //console.log(contents);
        document.getElementById('btn').addEventListener('click', download(array, 'test_png', files[0].type));

        function download(text, name, type) {
  var a = document.getElementById("a");
  var blob = new Blob([text], {type: type});
  var file = new File([blob], "test", {type: type});
  a.href = URL.createObjectURL(file);
  a.download = name;
}



    };
    reader.readAsArrayBuffer(files[0]);
}




  };
    runWasm();

});