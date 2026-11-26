export const gstr1InvoiceTransformer = invoices => {
  const rows = [];
  (invoices || []).forEach(inv => {
    const lineItems = inv.lineItems || [];
    const taxableItems = lineItems.filter(li => li.itemTax && (li.itemTax.gstTaxPercent || 0) > 0);
    const isSameInvoiceMultiTax = taxableItems.length > 1;
    const placeOfSupply = inv.destination?.state ?? 'N/A';

    const rowSpanCommon = taxableItems.length;
    if (taxableItems.length === 0) {
      rows.push({
        ...inv,
        placeOfSupply,
        isSameInvoiceMultiTax: false,
        isSameInvoiceMultiRow: false,
        rowSpanCommon: 1,
      });
      return;
    }

    taxableItems.forEach((li, idx) => {
      const t = li.itemTax;
      rows.push({
        contact: inv.contact,
        destination: inv.destination,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        invoiceAmount: inv.invoiceAmount,
        placeOfSupply,
        gstTaxPercent: t.gstTaxPercent,
        taxableAmount: t.taxableAmount,
        igst: t.igst,
        cgst: t.cgst,
        sgst: t.sgst,
        sgstUgst: t.sgstUgst,
        cess: t.cess,
        isSameInvoiceMultiTax,
        isSameInvoiceMultiRow: isSameInvoiceMultiTax,
        rowSpanCommon: idx === 0 ? rowSpanCommon : 0,
      });
    });
  });
  return rows;
};

export const gstr1NoteTransformer = notes => {
  const rows = [];
  (notes || []).forEach(note => {
    const lineItems = note.lineItems || [];
    const taxableItems = lineItems.filter(li => li.itemTax && (li.itemTax.gstTaxPercent || 0) > 0);
    const rowSpanCommon = taxableItems.length;
    const noteValue = lineItems.reduce((s, li) => s + (li.itemFinalAmount ?? 0), 0);

    if (taxableItems.length === 0) {
      rows.push({
        ...note,
        noteValue,
        rowSpanCommon: 1,
      });
      return;
    }

    taxableItems.forEach((li, idx) => {
      const t = li.itemTax;
      rows.push({
        recipientGSTIN: note.recipientGSTIN,
        recipientName: note.recipientName,
        noteNumber: note.noteNumber,
        noteDate: note.noteDate,
        originalInvoiceNumber: note.originalInvoiceNumber,
        originalInvoiceDate: note.originalInvoiceDate,
        noteValue,
        placeOfSupply: note.placeOfSupply,
        gstTaxPercent: t.gstTaxPercent,
        taxableAmount: t.taxableAmount,
        igst: t.igst,
        cgst: t.cgst,
        sgst: t.sgst,
        sgstUgst: t.sgstUgst,
        cess: t.cess,
        rowSpanCommon: idx === 0 ? rowSpanCommon : 0,
      });
    });
  });
  return rows;
};
