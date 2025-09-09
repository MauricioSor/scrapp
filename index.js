import { chromium } from "playwright";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

async function obtenerNovedades() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto("https://consultaexpedientes.justucuman.gov.ar/", { waitUntil: 'load' });

    const capitalBtn = page.getByRole('button', { name: /CAPITAL/i });
    await capitalBtn.click();
    console.log("Clickeado CAPITAL");

    const docLocBtn = page.getByRole('button', { name: /Documentos y Locaciones/i });
    await docLocBtn.click();
    console.log("Clickeado Documentos y Locaciones");

    await page.fill('input[name="number"]', "6129/24");
    console.log("Escrito número 6129/24");
    await page.waitForTimeout(1000);

    const buscarBtn = page.locator('button[type="submit"]');
    await buscarBtn.click();
    console.log("Clickeado Buscar");

    const fila = page.getByRole('row', { name: '6129/24 GARCIA BEATRIZ ANALIA' });
    const botonFila = fila.getByRole('button');
    await botonFila.click();
    console.log("Clickeado botón de la fila específica");
    await page.waitForTimeout(5000);

    const celdas = await page.locator('td.align-middle.text-center').allTextContents();
    const fechaHoy = hoyFormatoDDMMYYYY();
    const celdasHoy = celdas.filter(fecha => fecha.trim() === fechaHoy);
    console.log(`Cantidad de novedades de hoy: ${celdasHoy.length}`);

    if (celdasHoy.length > 0) {
        console.log("Hay novedades hoy! ", celdasHoy);
        await enviarCorreo(
            `Nuevo expediente: ${fechaHoy}`,
            `Se ha detectado un nuevo expediente con fecha ${fechaHoy}. Revisa el sistema.`
        );
    } else {
        console.log("No hay novedades hoy");
        await enviarCorreo(
            `No hay nuevos expedientes: ${fechaHoy}`,
            `No se han detectado nuevos expedientes con fecha ${fechaHoy}.`
        );
    }

    await browser.close();
    console.log("Navegador cerrado ✅");
}

function hoyFormatoDDMMYYYY() {
    const hoy = new Date();
    const dd = String(hoy.getDate()).padStart(2, '0');
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const yyyy = hoy.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

async function enviarCorreo(asunto, mensaje) {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.MY_MAIL,
            pass: process.env.MY_PASS
        },
        tls: { rejectUnauthorized: false }
    });

    await transporter.sendMail({
        from: '"Alerta Expedientes" <mauBot98@gmail.com>',
        to: "mauricioutn2017@gmail.com",
        subject: asunto,
        text: mensaje
    });

    console.log("Correo enviado ✅");
}

// -----------------------------
// Bucle con timer cada 1 minutos
// -----------------------------
async function loopScraper() {
    while (true) {
        try {
            console.log("Ejecutando scraper...");
            await obtenerNovedades();
        } catch (err) {
            console.error("Error ejecutando scraper:", err);
        }
        console.log("Esperando 2 minutos...");
        await new Promise(res => setTimeout(res, 1 * 60 * 1000)); // 2 minutos
    }
}

loopScraper();