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
    cell2.innerHTML = `<input type="number" class="precio" value="${precio}" oninput="calcularTotal()">`;
    cell3.innerHTML = `<button onclick="this.closest('tr').remove(); calcularTotal();">❌</button>`;
}

function guardarPresupuesto() {
    const data = {
        cliente: document.getElementById("cliente").value,
        numero: document.getElementById("numero").value,
        direccion: document.getElementById("direccion").value,
        fecha: document.getElementById("fecha").value,
        iva: document.getElementById("agregarIVA").checked,
        observaciones: document.getElementById("observaciones").value,
        items: Array.from(document.querySelectorAll('#tabla tbody tr')).map(tr => ({
            desc: tr.querySelector('.desc').value,
            precio: tr.querySelector('.precio').value
        }))
    };
    localStorage.setItem("presupuesto", JSON.stringify(data));
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

function descargarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const cliente = document.getElementById("cliente").value || "Cliente";
    const numero = document.getElementById("numero").value || "0001";
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
    doc.setFillColor(0, 0, 0);
    doc.rect(10, 55, 190, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("PRESUPUESTO", 90, 62);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text("Cliente: " + cliente, 20, 80);
    doc.text("Presupuesto N°: " + numero, 120, 80);

    // Dirección multilínea
    const direccion = document.getElementById("direccion").value || "";
    const direccionLines = doc.splitTextToSize("Dirección: " + direccion, 90);
    doc.text(direccionLines, 20, 90);

    // Fecha en línea separada debajo
    doc.text("Fecha: " + fecha, 120, 90 + direccionLines.length * 6);

    let y = 110;
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

    // Observaciones
    const obs = document.getElementById("observaciones").value;
    if (obs.trim()) {
        y += 20;
        doc.setFontSize(12);
        doc.text("Observaciones:", 20, y);
        const obsLines = doc.splitTextToSize(obs, 160);
        doc.text(obsLines, 20, y + 8);
    }

    doc.setFontSize(10);
    doc.text("Gracias por su preferencia", 80, 280);
    doc.line(10, 285, 200, 285);
    doc.text("Teléfono: +54 9 2494 46-8585 | Tandil Buenos Aires", 40, 290);
    doc.text("Dirección: Roncahue 150", 65, 295);

    const nombreArchivo = `Presupuesto_${numero}_${cliente}.pdf`;
    doc.save(nombreArchivo);
}
