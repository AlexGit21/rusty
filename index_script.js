import init, { encrypt_file, create_rsa, Keys, encrypt_aes_key, decrypt_file, encrypt_args} from "./pkg/rust.js";

        document.getElementById('btn2').addEventListener('click', generate_keys);

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
    var keyPair = await window.crypto.subtle.generateKey({
        name: "RSA-OAEP",
        modulusLength: 4096,
        publicExponent: new Uint8Array([1,0,1]),
        hash: "SHA-256"
    },
    true,
    ["encrypt", "decrypt"]);


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
        var file_decrypt = decrypt_file(file_encrypt.file, file_encrypt.key, file_encrypt.nonce);
        console.log(file_decrypt);
        var cons = create_rsa();
        encrypt_aes_key(cons.public, cons.private);

        //console.log(contents);
        document.getElementById('btn').addEventListener('click', download(array, 'test_png', files[0].type));

        function download(text, name, type) {
  var a = document.getElementById("a");
  var file = new Blob([text], {type: type});
  a.href = URL.createObjectURL(file);
  a.download = name;
}



    };
    reader.readAsArrayBuffer(files[0]);
}




  };
    runWasm();

});