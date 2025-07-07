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

    if (!numero || numero.trim() === "") {
        let ultimoNumero = parseInt(localStorage.getItem("ultimoNumeroPresupuesto") || "0");
        numero = (ultimoNumero + 1).toString().padStart(4, '0');
        document.getElementById("numero").value = numero;
        localStorage.setItem("ultimoNumeroPresupuesto", parseInt(numero));
    }

    const fecha = document.getElementById("fecha").value || new Date().toISOString().split('T')[0];

    const img = new Image();
    img.src = 'logo.png';
    img.onload = function () {
        doc.addImage(img, 'PNG', 15, 10, 40, 40);
        generarPDF(doc, cliente, numero, fecha);
    };
    img.onerror = function () {
        generarPDF(doc, cliente, numero, fecha);
    };
}

function generarPDF(doc, cliente, numero, fecha) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    // Título
    doc.setFontSize(22);
    doc.setTextColor(0, 75, 150);
    doc.setFont("helvetica", "bold");
    doc.text("PRESUPUESTO", 105, 35, null, null, "center");

    // Línea separadora
    doc.setDrawColor(0, 75, 150);
    doc.setLineWidth(0.8);
    doc.line(15, 45, 195, 45);

    // Cliente y otros datos
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);

    const clienteLines = doc.splitTextToSize("Cliente: " + cliente, 90);
    doc.text(clienteLines, 15, 55);

    const offsetY = clienteLines.length > 1 ? clienteLines.length * 6 : 0;
    doc.text("Presupuesto N°: " + numero, 130, 55 + offsetY);

    const direccion = document.getElementById("direccion").value || "";
    const direccionLines = doc.splitTextToSize("Dirección: " + direccion, 90);
    const yDireccion = 65 + offsetY;
    doc.text(direccionLines, 15, yDireccion);

    doc.text("Fecha: " + fecha, 130, yDireccion + direccionLines.length * 6);

    // Tabla de productos
    let y = yDireccion + direccionLines.length * 6 + 20;
    doc.setFillColor(0, 75, 150);
    doc.setDrawColor(0, 75, 150);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);

    doc.rect(15, y - 10, 180, 12, 'F');
    doc.text("Descripción", 20, y);
    doc.text("Precio", 150, y);

    y += 15;
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    const itemsDesc = document.querySelectorAll('.desc');
    const itemsPrecio = document.querySelectorAll('.precio');

    for (let i = 0; i < itemsDesc.length; i++) {
        const desc = itemsDesc[i].value || "";
        const precio = itemsPrecio[i].value || "0.00";

        const descLines = doc.splitTextToSize(desc, 120);
        doc.text(descLines, 20, y);
        doc.text("$" + parseFloat(precio).toFixed(2), 150, y);

        const blockHeight = descLines.length * 6;
        y += blockHeight + 6;

        doc.setDrawColor(220, 220, 220);
        doc.line(15, y - 4, 195, y - 4);
    }

    // Total
    doc.setFillColor(230, 240, 255);
    doc.rect(130, y, 70, 12, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    const total = parseFloat(document.getElementById("total").textContent).toLocaleString('es-AR', { minimumFractionDigits: 2 });
    doc.text("Total: $" + total, 150, y + 10);

    // Observaciones
    const obs = document.getElementById("observaciones").value;
    if (obs.trim()) {
        y += 25;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text("Observaciones:", 15, y);
        const obsLines = doc.splitTextToSize(obs, 180);
        doc.text(obsLines, 15, y + 8);
    }

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Gracias por su preferencia", 105, 280, null, null, "center");
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 285, 195, 285);
    doc.text("Teléfono: +54 9 2494 46-8585 | Tandil Buenos Aires", 105, 290, null, null, "center");
    doc.text("Dirección: Roncahue 150", 105, 295, null, null, "center");

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
        option.value = presupuestos.length - 1 - index;
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
