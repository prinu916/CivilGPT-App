/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum ProjectType {
  HOUSE = "House",
  VILLA = "Villa",
  APARTMENT = "Apartment",
  DUPLEX = "Duplex",
  COMMERCIAL = "Commercial",
  OFFICE = "Office",
  HOSPITAL = "Hospital",
  MALL = "Mall",
  SCHOOL = "School",
  FACTORY = "Factory",
  WAREHOUSE = "Warehouse",
  BRIDGE = "Bridge",
  ROAD = "Road",
  INTERIOR = "Interior",
  LANDSCAPE = "Landscape",
  INFRASTRUCTURE = "Infrastructure"
}

export enum UserRole {
  HOME_OWNER = "Home Owner",
  CIVIL_ENGINEER = "Civil Engineer",
  ARCHITECT = "Architect",
  BUILDER = "Builder",
  INTERIOR_DESIGNER = "Interior Designer",
  STRUCTURAL_ENGINEER = "Structural Engineer",
  CONTRACTOR = "Contractor",
  QUANTITY_SURVEYOR = "Quantity Surveyor",
  STUDENT = "Student",
  ADMIN = "Admin"
}

export enum AccentColor {
  BLUE = "blue",
  ORANGE = "orange",
  GREEN = "green",
  GRAY = "gray"
}

export enum Language {
  EN = "en",
  HI = "hi"
}

export enum DrawingStyle {
  BLUEPRINT = "Blueprint",
  CAD = "CAD Drawing",
  PENCIL_SKETCH = "Pencil Sketch",
  REALISTIC_RENDER = "Realistic Render",
  XRAY_STRUCTURE = "X-Ray Structure",
  EXPLODED_VIEW = "Exploded View"
}

// 2D/3D Design Elements
export interface BaseElement {
  id: string;
  name: string;
  type: "wall" | "door" | "window" | "column" | "beam" | "furniture" | "pool" | "garden";
  x: number; // grid coords (0-100)
  y: number;
  width: number;
  height: number;
  rotation?: number; // degrees
  properties: Record<string, any>;
}

export interface Room {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  type: string; // "Living", "Bedroom", "Kitchen", "Bath", etc.
}

export interface StructuralDetails {
  concreteGrade: string; // e.g. "M25"
  steelGrade: string; // e.g. "Fe500"
  bearingCapacity: number; // kN/m2
  seismicZone: string; // e.g. "Zone IV"
  windSpeed: number; // m/s
  factorOfSafety: number;
}

export interface MaterialItem {
  id: string;
  name: string;
  category: "structural" | "finishing" | "plumbing" | "electrical" | "hvac";
  quantity: number;
  unit: string;
  rate: number;
  cost: number;
  efficiencyRating?: string; // eco rating
}

export interface BOQItem {
  id: string;
  code: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
  agentResponsible: string; // e.g. "Quantity Surveyor AI"
}

export interface TimelineTask {
  id: string;
  task: string;
  phase: "Foundation" | "Substructure" | "Superstructure" | "MEP" | "Finishing" | "Handover";
  startDate: string;
  durationDays: number;
  progress: number; // 0-100
  dependencies: string[];
  status: "completed" | "active" | "pending" | "delayed";
  riskLevel: "low" | "medium" | "high";
  delayPrediction?: string; // AI notes
}

export interface DroneIssue {
  id: string;
  type: "crack" | "misalignment" | "safety" | "progress";
  location: string;
  severity: "low" | "medium" | "critical";
  description: string;
  detectedAt: string;
  resolved: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  type: ProjectType;
  owner: string;
  status: "Concept" | "Planning" | "In Construction" | "Inspection" | "Completed";
  budget: number; // in USD
  location: string;
  createdAt: string;
  rooms: Room[];
  elements: BaseElement[];
  structural: StructuralDetails;
  materials: MaterialItem[];
  boq: BOQItem[];
  timeline: TimelineTask[];
  droneIssues: DroneIssue[];
  sustainabilityScore: number; // 0-100
  complianceScore: number; // 0-100
  complianceNotes: string[];
}

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant" | "system";
  textEn: string;
  textHi: string;
  timestamp: string;
  agentName?: string; // which sub-agent e.g. "Structural AI"
  suggestions?: string[];
  updatedProjectState?: Partial<Project>;
}

export interface AIState {
  isStreaming: boolean;
  activeAgents: string[]; // Agents currently "thinking"
  conversationHistory: ChatMessage[];
}
