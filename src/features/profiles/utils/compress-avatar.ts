export const compressAvatar = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, 400 / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      if (!context) { reject(new Error("Não foi possível processar a imagem.")); return; }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob || blob.type !== "image/webp") {
          reject(new Error("Não foi possível converter a imagem para WebP."));
        } else if (blob.size > 1024 * 1024) {
          reject(new Error("A imagem convertida deve ter até 1 MB."));
        } else {
          resolve(blob);
        }
      }, "image/webp", 0.82);
    };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Imagem inválida.")); };
    image.src = url;
  });
};
