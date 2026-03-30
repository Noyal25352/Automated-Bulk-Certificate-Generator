import { createCanvas } from "@napi-rs/canvas";

export async function genCert(name, college, width, height, backgroundImage) {
    if (typeof width !== 'number' || typeof height !== 'number' || width <= 0 || height <= 0) {
        throw new Error('Width and height must be positive numbers');
    }
    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");

    context.drawImage(backgroundImage, 0, 0, width, height);
    context.font = 'bold 380px "bell-mt-bold"';
    context.fillStyle = "#000000";
    context.textAlign = "center";
    const nameY = (height - 1575) / 2;
    context.fillText(name.toUpperCase(), width / 2, nameY);

    context.font = 'bold 265px "bell-mt-bold"';
    const nameY2 = nameY + 500;
    context.fillText(college.toUpperCase(), width / 2, nameY2);

    return canvas.toBuffer("image/png");
};