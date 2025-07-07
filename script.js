function calcularTotal() {
    let total = 0;
    document.querySelectorAll('.precio').forEach(input => {
        total += parseFloat(input.value) || 0;
    });

    if (document.getElementById("agregarIVA").checked) {
        total *= 1.21;
    }

    document.getElementById("total").textContent = total.toFixed(2);
}

function agregarFila(desc = '', precio = 0) {
    let tableBody = document.querySelector("#tabla tbody");
    let row = tableBody.insertRow();

    let cell1 = row.insertCell(0);
    let cell2 = row.insertCell(1);
    let cell3 = row.insertCell(2);

    cell1.innerHTML = `<input type="text" class="desc" placeholder="Descripción" value="${desc}">`;
    cell2.innerHTML = `<input type="number" class="precio" step="0.01" value="${precio}" oninput="calcularTotal()">`;
    cell3.innerHTML = `<button type="button" onclick="this.closest('tr').remove(); calcularTotal();">❌</button>`;
}

function guardarPresupuesto() {
    let numero = document.getElementById("numero").value.trim();

    if (!numero) {
        let ultimoNumero = parseInt(localStorage.getItem("ultimoNumeroPresupuesto") || "0");
        numero = (ultimoNumero + 1).toString().padStart(4, '0');
        document.getElementById("numero").value = numero;
        localStorage.setItem("ultimoNumeroPresupuesto", parseInt(numero));
    } else {
        let ultimoNumero = parseInt(localStorage.getItem("ultimoNumeroPresupuesto") || "0");
        let numeroInt = parseInt(numero);
        if (numeroInt > ultimoNumero) {
            localStorage.setItem("ultimoNumeroPresupuesto", numeroInt);
        }
    }

    const data = {
        cliente: document.getElementById("cliente").value,
        numero: numero,
        direccion: document.getElementById("direccion").value,
        fecha: document.getElementById("fecha").value,
        iva: document.getElementById("agregarIVA").checked,
        observaciones: document.getElementById("observaciones").value,
        items: Array.from(document.querySelectorAll('#tabla tbody tr')).map(tr => ({
            desc: tr.querySelector('.desc').value,
            precio: tr.querySelector('.precio').value
        }))
    };

    let presupuestos = JSON.parse(localStorage.getItem("presupuestos")) || [];
    presupuestos.push(data);

    // Mantener solo los últimos 10 presupuestos
    if (presupuestos.length > 10) {
        presupuestos = presupuestos.slice(presupuestos.length - 10);
    }

    localStorage.setItem("presupuestos", JSON.stringify(presupuestos));
    localStorage.setItem("presupuesto", JSON.stringify(data)); // último presupuesto cargado

    alert("Presupuesto guardado");
}


function cargarPresupuesto() {
    const data = JSON.parse(localStorage.getItem("presupuesto"));
    if (!data) return alert("No hay presupuesto guardado");

    document.getElementById("cliente").value = data.cliente;
    document.getElementById("numero").value = data.numero;
    document.getElementById("direccion").value = data.direccion;
    document.getElementById("fecha").value = data.fecha;
    document.getElementById("agregarIVA").checked = data.iva;
    document.getElementById("observaciones").value = data.observaciones;

    const tbody = document.querySelector("#tabla tbody");
    tbody.innerHTML = "";
    data.items.forEach(item => agregarFila(item.desc, item.precio));

    calcularTotal();
}

window.addEventListener("DOMContentLoaded", () => {
    if (document.querySelectorAll("#tabla tbody tr").length === 0) {
        agregarFila();
    }
    poblarHistorial();
});


function descargarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const cliente = document.getElementById("cliente").value || "Cliente";
    let numero = document.getElementById("numero").value;

    // Si el campo está vacío, tomar el siguiente correlativo
    if (!numero || numero.trim() === "") {
        let ultimoNumero = parseInt(localStorage.getItem("ultimoNumeroPresupuesto") || "0");
        numero = (ultimoNumero + 1).toString().padStart(4, '0');
        document.getElementById("numero").value = numero;
    }

    // Guardar el nuevo número como el último usado
    localStorage.setItem("ultimoNumeroPresupuesto", parseInt(numero));

    const fecha = document.getElementById("fecha").value || new Date().toISOString().split('T')[0];

    const img = new Image();
    img.src = 'logo.png';
    img.onload = function () {
        doc.addImage(img, 'PNG', 10, 10, 40, 40);
        generarPDF(doc, cliente, numero, fecha);
    };
    img.onerror = function () {
        generarPDF(doc, cliente, numero, fecha);
    };
}

function generarPDF(doc, cliente, numero, fecha) {
    doc.setFont("helvetica", "normal");

    doc.setFillColor(0, 0, 0);
    doc.rect(10, 55, 190, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("PRESUPUESTO", 105, 62, null, null, 'center');

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);

    const clienteLines = doc.splitTextToSize("Cliente: " + cliente, 90);
    doc.text(clienteLines, 20, 80);

    const offsetY = clienteLines.length > 1 ? (clienteLines.length - 1) * 6 : 0;
    doc.text("Presupuesto N°: " + numero, 120, 80 + offsetY);

    const direccion = document.getElementById("direccion").value || "";
    const direccionLines = doc.splitTextToSize("Dirección: " + direccion, 90);
    const yDireccion = 90 + offsetY;
    doc.text(direccionLines, 20, yDireccion);
    doc.text("Fecha: " + fecha, 120, yDireccion + direccionLines.length * 6);

    let y = yDireccion + direccionLines.length * 6 + 20;
    doc.setFontSize(14);
    doc.text("Descripción", 20, y);
    doc.text("Precio", 150, y);
    doc.line(20, y + 2, 190, y + 2);
    y += 10;

    const itemsDesc = document.querySelectorAll('.desc');
    const itemsPrecio = document.querySelectorAll('.precio');
    doc.setFontSize(12);

    for (let i = 0; i < itemsDesc.length; i++) {
        const desc = itemsDesc[i].value || "";
        const precio = itemsPrecio[i].value || "0.00";

        const descLines = doc.splitTextToSize(desc, 120);
        doc.text(descLines, 20, y);
        doc.text("$" + parseFloat(precio).toFixed(2), 150, y);

        const lineHeight = 6;
        const blockHeight = descLines.length * lineHeight;

        y += blockHeight + 2;
        doc.line(20, y, 190, y);
        y += 4;
    }

    doc.setFontSize(14);
    const total = parseFloat(document.getElementById("total").textContent).toLocaleString('es-AR', { minimumFractionDigits: 2 });
    doc.text("Total: $" + total, 150, y + 10);

    const obs = document.getElementById("observaciones").value;
    if (obs.trim()) {
        y += 20;
        doc.setFontSize(12);
        doc.text("Observaciones:", 20, y);
        const obsLines = doc.splitTextToSize(obs, 160);
        doc.text(obsLines, 20, y + 8);
    }

    doc.setFontSize(10);
    doc.text("Gracias por su preferencia", 105, 280, null, null, 'center');
    doc.line(10, 285, 200, 285);
    doc.text("Teléfono: +54 9 2494 46-8585 | Tandil Buenos Aires", 40, 290);
    doc.text("Dirección: Roncahue 150", 65, 295);

    const nombreArchivo = `Presupuesto_${numero}_${cliente.replace(/\s+/g, "_").substring(0, 30)}.pdf`;
    doc.save(nombreArchivo);
}


function poblarHistorial() {
    const select = document.getElementById("presupuestoHistorial");
    const presupuestos = JSON.parse(localStorage.getItem("presupuestos")) || [];

    select.innerHTML = '<option value="">-- Seleccioná uno --</option>';

    presupuestos.slice().reverse().forEach((presupuesto, index) => {
        const texto = `${presupuesto.numero} - ${presupuesto.cliente}`;
        const option = document.createElement("option");
        option.value = presupuestos.length - 1 - index; // índice original
        option.textContent = texto;
        select.appendChild(option);
    });
}

function cargarDesdeHistorial() {
    const index = document.getElementById("presupuestoHistorial").value;
    if (index === "") return;

    const presupuestos = JSON.parse(localStorage.getItem("presupuestos")) || [];
    const data = presupuestos[index];

    if (!data) return alert("Presupuesto no encontrado");

    document.getElementById("cliente").value = data.cliente;
    document.getElementById("numero").value = data.numero;
    document.getElementById("direccion").value = data.direccion;
    document.getElementById("fecha").value = data.fecha;
    document.getElementById("agregarIVA").checked = data.iva;
    document.getElementById("observaciones").value = data.observaciones;

    const tbody = document.querySelector("#tabla tbody");
    tbody.innerHTML = "";
    data.items.forEach(item => agregarFila(item.desc, item.precio));

    calcularTotal();
}
