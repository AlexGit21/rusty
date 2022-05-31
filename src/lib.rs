use wasm_bindgen::prelude::*;
use std::str;
use std::string;
use chacha20poly1305::{ChaCha20Poly1305, Key, Nonce}; // Or `Aes128Gcm`
use chacha20poly1305::aead::{Aead, NewAead};
use rand::Rng;
use rand::distributions::Alphanumeric;
use hkdf::Hkdf;
use sha2::{Sha256, Digest};
use rsa::{PublicKey, RsaPrivateKey, RsaPublicKey, PaddingScheme, pkcs1::ToRsaPrivateKey, pkcs1::ToRsaPublicKey, pkcs1::FromRsaPrivateKey, pkcs1::FromRsaPublicKey};//pkcs8::FromPublicKey, pkcs8::FromPrivateKey
use pem::Pem;





#[wasm_bindgen]
extern "C" {
    // Use `js_namespace` here to bind `console.log(..)` instead of just
    // `log(..)`
    #[wasm_bindgen(js_namespace = console)]
    //fn log(a: Vec<u8>);

    //fn log(a: &[u8]);

    fn log(s: Vec<u8>);
}

#[wasm_bindgen]
pub fn compute(a: i32, b: i32) -> i32 {
    return a * b;
}
#[wasm_bindgen(getter_with_clone)]
pub struct Keys{
    pub private: String,
    pub public: String
}

#[wasm_bindgen]
pub fn create_rsa() -> Keys {

    let mut rng = rand::thread_rng();
    //let public_key = RsaPublicKey::from_public_key_pem(pem_public_key);
    //let private_key = RsaPrivateKey::from_pkcs8_pem(pem_private_key);

    let bits = 2048;
    let private_key = RsaPrivateKey::new(&mut rng, bits).expect("failed to generate a key");
    let public_key = RsaPublicKey::from(&private_key);

    let private_pem = RsaPrivateKey::to_pkcs1_pem(&private_key);
    let public_pem = RsaPublicKey::to_pkcs1_pem(&public_key);

    //log(&private_pem.unwrap());
    //log(&public_pem.unwrap());
    let mut private_s: String = String::new();
    private_s.push_str(&private_pem.unwrap());
    let mut public_s: String = String::new();
    public_s.push_str(&public_pem.unwrap());
    //let pems = private_pem.unwrap();

    let keys = Keys {
        private: private_s,
        public: public_s
    };

    return keys;

}


#[wasm_bindgen]
pub fn encrypt_aes_key(pub_pem: String, priv_pem: String) -> Vec<u8>{

    let pub_str = &pub_pem.as_str();
    let priv_str = &priv_pem.as_str();

    let mut rng = rand::thread_rng();
    let public_key = RsaPublicKey::from_pkcs1_pem(pub_str).unwrap();
    let private_key = RsaPrivateKey::from_pkcs1_pem(priv_str).unwrap();

    // Encrypt
    let data = b"hello world";


    let padding = PaddingScheme::new_pkcs1v15_encrypt();
    let enc_data = public_key.encrypt(&mut rng, padding, &data[..]).expect("failed to encrypt");


    /*log(enc_data);
    // Decrypt
    let padding = PaddingScheme::new_pkcs1v15_encrypt();
    let dec_data = private_key.decrypt(padding, &enc_data).expect("failed to decrypt");
    assert_eq!(&data[..], &dec_data[..]);*/

    return enc_data;
}


#[wasm_bindgen(getter_with_clone)]
pub struct encrypt_args{
    pub key: String,
    pub nonce: String,
    pub file: Vec<u8>
}

#[wasm_bindgen]
pub fn encrypt_file(file_data: Vec<u8>) -> encrypt_args{

    /*let salt: String = rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(32)
        .map(char::from)
        .collect();*/


    //log(&salt);

    let rnd_key: String = rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(32)
        .map(char::from)
        .collect();
    //log(&rnd_key);
    /*let mut h256 = Sha256::new();
    h256.update(rnd_key.as_bytes());
    let hash = format!("{:x}", h256.finalize());*/

    //log(&hash);




    let rnd_nonce: String = rand::thread_rng()
        .sample_iter(&Alphanumeric)
        .take(12)
        .map(char::from)
        .collect();

    let msg_file_data = &file_data;
    let msg: &[u8] = &msg_file_data;

    let key = Key::from_slice(rnd_key.as_bytes());
    let cipher = ChaCha20Poly1305::new(key);

    let nonce = Nonce::from_slice(rnd_nonce.as_bytes()); // 96-bits; unique per message

    let ciphertext = cipher.encrypt(nonce, msg.as_ref())
        .expect("encryption failure!"); // NOTE: handle this error to avoid panics!

    /*let plaintext = cipher.decrypt(nonce, ciphertext.as_ref())
        .expect("decryption failure!"); // NOTE: handle this error to avoid panics!*/
    //log(ciphertext);
    let aes_args = encrypt_args {
        key: rnd_key,
        nonce: rnd_nonce,
        file: ciphertext
    };

    return aes_args;



    //log(&plaintext);
    //file_data: Vec<u8>
    //let msg_file_data = &file_data;
    //let msg: &[u8] = &msg_file_data;
    //log(file_data);
}

#[wasm_bindgen]
pub fn decrypt_file(file_data: Vec<u8>, key_arg: String, nonce_arg: String) -> Vec<u8>{

    let key = Key::from_slice(key_arg.as_bytes());
    let cipher = ChaCha20Poly1305::new(key);

    let nonce = Nonce::from_slice(nonce_arg.as_bytes()); // 96-bits; unique per message

    let plaintext = cipher.decrypt(nonce, file_data.as_ref())
        .expect("decryption failure!"); // NOTE: handle this error to avoid panics!


    return plaintext;
}

#[wasm_bindgen]
pub fn say(s: String) -> String {
    let r = String::from("hello ");
    return r + &s;
}



