/// <reference types="vite/client" />

declare global { 
    namespace NodeJS {
        interface ProcessEnv {
            REACT_APP_GOOGLE_MAPS_API_KEY: string;
        }
    }
}

interface ImportMetaEnv {
    readonly VITE_GOOGLE_MAPS_API_KEY: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

export {};