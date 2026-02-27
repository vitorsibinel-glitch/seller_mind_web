export interface ParsedNFeData {
  number: string;
  type: "entry" | "exit";
  emittedAt: string;
  totalAmount: string;
  cnpjCpf: string;
  partnerName: string;
  xmlRaw: string;
}

export async function parseNFeXML(file: File): Promise<ParsedNFeData> {
  const text = await file.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, "text/xml");

  const parserError = xmlDoc.querySelector("parsererror");
  if (parserError) {
    throw new Error("XML inválido");
  }

  const getTextContent = (tagName: string): string => {
    const element = xmlDoc.getElementsByTagName(tagName)[0];
    return element?.textContent?.trim() || "";
  };

  const nNF = getTextContent("nNF");
  const dhEmi = getTextContent("dhEmi") || getTextContent("dEmi");
  const vNF = getTextContent("vNF");

  const tpNF = getTextContent("tpNF");
  const type: "entry" | "exit" = tpNF === "0" ? "entry" : "exit";

  const emitCNPJ = getTextContent("emit")
    ? xmlDoc.querySelector("emit CNPJ")?.textContent?.trim() || ""
    : "";
  const emitName = getTextContent("emit")
    ? xmlDoc.querySelector("emit xNome")?.textContent?.trim() || ""
    : "";

  const destCNPJ = getTextContent("dest")
    ? xmlDoc.querySelector("dest CNPJ")?.textContent?.trim() ||
      xmlDoc.querySelector("dest CPF")?.textContent?.trim() ||
      ""
    : "";
  const destName = getTextContent("dest")
    ? xmlDoc.querySelector("dest xNome")?.textContent?.trim() || ""
    : "";

  const isEntry = type === "entry";
  const cnpjCpf = isEntry ? emitCNPJ : destCNPJ;
  const partnerName = isEntry ? emitName : destName;

  let formattedDate = "";
  if (dhEmi) {
    const date = new Date(dhEmi);
    if (!isNaN(date.getTime())) {
      formattedDate = date.toISOString().split("T")[0] as string;
    }
  }

  return {
    number: nNF,
    type,
    emittedAt: formattedDate,
    totalAmount: vNF,
    cnpjCpf,
    partnerName,
    xmlRaw: text,
  };
}
