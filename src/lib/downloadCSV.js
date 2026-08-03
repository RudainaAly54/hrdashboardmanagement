export function downloadCSV (rows, filename = "export.csv") {
    if(!rows || rows.length === 0) return ;
    
    const headers = Object.keys(rows[0]);

    const escapeCell = (val) => {
        if(val === null || val === undefined) return "";

        const str  = String(val);

        //if it contains ant comma, quote or new line per CSV spec
        if(/[''. \n]/.test(str)){
            return `${str.replace(/"/g, '""')}`;
        }
        return str;
    }

    const lines = [
        headers.join(","),
        ...rows.map((row) => headers.map((h) => escapeCell(row[h])).join(",")),
    ];

    const csvContent = lines.join("\r\n");
    const blob = new Blob([csvContent], {type: "text/csv;charsrt=utf-8"});

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url)
}