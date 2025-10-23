import { chromium } from "playwright";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

async function obtenerNovedades() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto("https://consultaexpedientes.justucuman.gov.ar/", { waitUntil: 'load' });

    // Click en "CAPITAL"
    await page.getByRole('button', { name: /CAPITAL/i }).click();
    

    // Click en "Documentos y Locaciones"
    await page.getByRole('button', { name: /Documentos y Locaciones/i }).click();
    

    // Escribir en input
    await page.fill('input[name="number"]', `${process.env.MY_EXP}`);
    
    await page.waitForTimeout(1000);

    // Click en "Buscar"
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(5000);
    const fila = page.getByRole('row', { name: `${process.env.MY_EXP} ${process.env.MY_NAME}` });
    await page.waitForTimeout(5000);
    await fila.getByRole('button').click();
    await page.waitForTimeout(5000);

    // Revisar fechas
    const celdas = await page.locator('td.align-middle.text-center').allTextContents();
    const fechaHoy = hoyFormatoDDMMYYYY();
    const celdasHoy = celdas.filter(fecha => fecha.trim() === fechaHoy);


    if (celdasHoy.length > 0) {
        
        await enviarCorreo(
            `Nuevo expediente: ${fechaHoy}`,
            `Se ha detectado un nuevo expediente con fecha ${fechaHoy}. Revisa el sistema.`
        );
    } else {
        
        await enviarCorreo(
            `No hay nuevos expedientes: ${fechaHoy}`,
            `No se han detectado nuevos expedientes con fecha ${fechaHoy}.
            Ultimo expediente con fecha ${celdas[1]} ${celdas[2]}`
        );
    }

    await browser.close();
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

// Ejecutar solo una vez
obtenerNovedades();
