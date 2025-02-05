// global.d.ts (ou declare-modules.d.ts)
declare module 'docxtemplater-image-module-free' {
    interface ImageModuleOptions {
      getImage?(tagValue: string): Promise<Buffer | ArrayBuffer>;
      getSize?(
        img: Buffer | ArrayBuffer,
        tagValue?: string
      ): [number, number];
      // Caso precise, adicione mais props. 
      // Se "centered" ou "getProps" etc. da doc.
    }
  
    export class ImageModule {
      constructor(options: ImageModuleOptions);
    }
  }
  