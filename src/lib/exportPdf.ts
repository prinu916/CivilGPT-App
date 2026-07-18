import { jsPDF } from "jspdf";
import { Project } from "../types";
import { getProjectMetrics, formatCurrency } from "../utils";

export const exportProjectPDF = (
  project: Project,
  lang: "en" | "hi",
  regionalMultiplier: number
) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const metrics = getProjectMetrics(project);

  // Styling Constants
  const primaryColor = [17, 24, 39]; // Slate 900
  const secondaryColor = [37, 99, 235]; // Blue 600
  const textColor = [55, 65, 81]; // Gray 700
  const lightGray = [243, 244, 246]; // Gray 100
  const accentColor = [16, 185, 129]; // Emerald 500

  let y = 15;

  // 1. HEADER BRANDING
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("CivilGPT", 15, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(156, 163, 175);
  doc.text("Professional Construction & Design Report", 15, 24);

  const dateStr = new Date().toLocaleDateString(lang === "hi" ? "hi-IN" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(`Generated: ${dateStr}`, 15, 30);

  // Logo Placeholder Icon
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(1);
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.rect(170, 10, 25, 20, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("OS", 179, 23);

  y = 52;

  // 2. PROJECT SUMMARY CARD
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("1. Project Summary", 15, y);
  y += 6;

  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(15, y, 195, y);
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Project Name:", 15, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(project.name, 45, y);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Location:", 120, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(project.location, 140, y);
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Project Type:", 15, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(project.type, 45, y);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Client/Owner:", 120, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(project.owner, 148, y);
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Status:", 15, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(project.status, 45, y);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Base Budget:", 120, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(formatCurrency(project.budget, lang), 148, y);
  y += 8;

  // Description
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Description:", 15, y);
  y += 4.5;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  const descLines = doc.splitTextToSize(project.description, 180);
  doc.text(descLines, 15, y);
  y += descLines.length * 4.5 + 4;

  // 3. KEY METRICS GRID (BENTO MOCKUP)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("2. Engineering Metrics & Ratings", 15, y);
  y += 6;
  doc.line(15, y, 195, y);
  y += 6;

  // 4 Boxes
  const boxW = 42;
  const boxH = 18;
  const spacing = 4;

  const bentoItems = [
    { label: "Concrete Volume", val: `${metrics.concreteVolume} m³` },
    { label: "Steel Rebar", val: `${metrics.steelWeight.toFixed(1)} tons` },
    { label: "Sustainability", val: `${project.sustainabilityScore}/100` },
    { label: "Compliance Rate", val: `${project.complianceScore}/100` },
  ];

  bentoItems.forEach((box, i) => {
    const boxX = 15 + i * (boxW + spacing);
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(boxX, y, boxW, boxH, "F");
    doc.setDrawColor(229, 231, 235);
    doc.rect(boxX, y, boxW, boxH, "S");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(box.label, boxX + 3, y + 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(box.val, boxX + 3, y + 13);
  });
  y += boxH + 10;

  // 4. MUNICIPAL BYLAW COMPLIANCE
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("3. Municipal Bylaws Audit Log", 15, y);
  y += 6;
  doc.line(15, y, 195, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  project.complianceNotes.forEach((note) => {
    // Draw small green checkbox indicator
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(15, y - 2.5, 3, 3, "F");
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    const noteLines = doc.splitTextToSize(note, 170);
    doc.text(noteLines, 21, y);
    y += noteLines.length * 4.5 + 2;
  });
  y += 6;

  // PAGE BREAK FOR BOQ TABLE
  doc.addPage();
  let yPage2 = 15;

  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`${project.name} - Detailed Bill of Quantities (BOQ)`, 15, 13);

  yPage2 = 30;

  // 5. BILL OF QUANTITIES (BOQ) TABLE
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("4. Estimated Bill of Quantities", 15, yPage2);
  yPage2 += 6;
  doc.setDrawColor(229, 231, 235);
  doc.line(15, yPage2, 195, yPage2);
  yPage2 += 6;

  // Header row
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.rect(15, yPage2, 180, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Code", 17, yPage2 + 5.5);
  doc.text("Description", 35, yPage2 + 5.5);
  doc.text("Unit", 110, yPage2 + 5.5);
  doc.text("Qty", 125, yPage2 + 5.5);
  doc.text("Rate", 145, yPage2 + 5.5);
  doc.text("Total", 175, yPage2 + 5.5);
  yPage2 += 8;

  // Body rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  let boqTotal = 0;

  project.boq.forEach((item) => {
    const rate = item.rate * regionalMultiplier;
    const itemTotal = Math.round(item.quantity * rate);
    boqTotal += itemTotal;

    const descText = item.description;
    const descLines = doc.splitTextToSize(descText, 72);
    const rowH = Math.max(8, descLines.length * 4);

    // Draw row bottom line
    doc.setDrawColor(243, 244, 246);
    doc.line(15, yPage2 + rowH, 195, yPage2 + rowH);

    doc.setFont("helvetica", "bold");
    doc.text(item.code, 17, yPage2 + 5);
    doc.setFont("helvetica", "normal");
    doc.text(descLines, 35, yPage2 + 5);
    doc.text(item.unit, 110, yPage2 + 5);
    doc.text(item.quantity.toLocaleString(), 125, yPage2 + 5);
    doc.text(formatCurrency(rate, lang), 145, yPage2 + 5);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(formatCurrency(itemTotal, lang), 175, yPage2 + 5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);

    yPage2 += rowH;
  });

  yPage2 += 6;

  // Grand total
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.rect(120, yPage2, 75, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Grand Total (BOQ):", 123, yPage2 + 6.5);
  doc.text(formatCurrency(boqTotal, lang), 168, yPage2 + 6.5);

  // Footer on bottom of Page 2
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text("This is an AI-generated procurement estimate. Material rates are subject to regional supplier indexes.", 15, 280);
  doc.text("CivilGPT Operating OS - Confidential Engineering Document", 150, 280);

  // Save the PDF
  doc.save(`${project.name.toLowerCase().replace(/\s+/g, "_")}_report.pdf`);
};
