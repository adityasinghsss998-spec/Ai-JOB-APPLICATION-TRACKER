"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectFormFields = detectFormFields;
exports.submitJobApplication = submitJobApplication;
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var os_1 = __importDefault(require("os"));
var zod_1 = require("zod");
var stream_1 = require("stream");
var promises_1 = require("stream/promises");
/**
 * Downloads a resume from public URL to local temp path for uploading in Browser base
 */
function downloadResume(fileUrl, fileName) {
    return __awaiter(this, void 0, void 0, function () {
        var tempDir, filePath, response, fileStream, reader;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tempDir = os_1.default.tmpdir();
                    filePath = path_1.default.join(tempDir, "".concat(Date.now(), "_").concat(fileName));
                    return [4 /*yield*/, fetch(fileUrl)];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("Failed to fetch resume: ".concat(response.statusText));
                    }
                    if (!response.body) {
                        throw new Error("Failed to download resume: Response body is missing for URL ".concat(fileUrl));
                    }
                    fileStream = fs_1.default.createWriteStream(filePath);
                    reader = stream_1.Readable.fromWeb(response.body);
                    reader.pipe(fileStream);
                    return [4 /*yield*/, (0, promises_1.finished)(fileStream)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, filePath];
            }
        });
    });
}
/**
 * Resolves the automation mode based on environment variables
 */
function getAutomationMode() {
    var apiKey = process.env.BROWSERBASE_API_KEY;
    var projectId = process.env.BROWSERBASE_PROJECT_ID;
    var geminiKey = process.env.GEMINI_API_KEY;
    var modeEnv = (process.env.AUTOMATION_MODE || "LOCAL").toUpperCase();
    if (modeEnv === "SIMULATION") {
        return { mode: "SIMULATION" };
    }
    var hasBrowserbase = apiKey && projectId && apiKey !== projectId && !apiKey.includes("placeholder") && !projectId.includes("placeholder");
    if (modeEnv === "BROWSERBASE") {
        if (hasBrowserbase) {
            return { mode: "BROWSERBASE", apiKey: apiKey, projectId: projectId };
        }
        else if (geminiKey && !geminiKey.includes("placeholder")) {
            console.warn("BROWSERBASE mode requested but credentials invalid/missing. Falling back to LOCAL mode.");
            return { mode: "LOCAL" };
        }
        else {
            console.warn("BROWSERBASE mode requested but credentials and GEMINI_API_KEY missing. Falling back to SIMULATION mode.");
            return { mode: "SIMULATION" };
        }
    }
    // Default is LOCAL if GEMINI_API_KEY is configured
    if (geminiKey && !geminiKey.includes("placeholder")) {
        if (hasBrowserbase && modeEnv !== "LOCAL") {
            return { mode: "BROWSERBASE", apiKey: apiKey, projectId: projectId };
        }
        return { mode: "LOCAL" };
    }
    console.warn("No valid AI credentials found. Falling back to SIMULATION mode.");
    return { mode: "SIMULATION" };
}
/**
 * Detects form fields on the job page using Browserbase + Stagehand
 */
function detectFormFields(jobUrl, platform) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, mode, apiKey, projectId, isLocal, isHeadless, stagehandInstance, Stagehand, page, result, rawSessionId, sessionId, err_1, closeErr_1;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _a = getAutomationMode(), mode = _a.mode, apiKey = _a.apiKey, projectId = _a.projectId;
                    if (mode === "SIMULATION") {
                        console.log("Using Simulation Mode for field detection.");
                        return [2 /*return*/, runDetectionSimulation(platform)];
                    }
                    isLocal = mode === "LOCAL";
                    isHeadless = process.env.STAGEHAND_HEADLESS === "true" || (isLocal ? false : true);
                    console.log("Running field detection in ".concat(mode, " mode (headless: ").concat(isHeadless, ")..."));
                    stagehandInstance = null;
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 8, , 13]);
                    return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require("@browserbasehq/stagehand")); })];
                case 2:
                    Stagehand = (_d.sent()).Stagehand;
                    stagehandInstance = new Stagehand({
                        env: mode,
                        apiKey: isLocal ? undefined : apiKey,
                        projectId: isLocal ? undefined : projectId,
                        headless: isHeadless,
                        modelName: "google/gemini-2.0-flash",
                        modelClientOptions: {
                            apiKey: process.env.GEMINI_API_KEY,
                        },
                    });
                    return [4 /*yield*/, stagehandInstance.init()];
                case 3:
                    _d.sent();
                    page = stagehandInstance.context.activePage();
                    if (!page) {
                        throw new Error("Failed to get active browser page");
                    }
                    return [4 /*yield*/, page.goto(jobUrl)];
                case 4:
                    _d.sent();
                    // Give it a moment to load fully
                    return [4 /*yield*/, page.waitForLoadState("networkidle")];
                case 5:
                    // Give it a moment to load fully
                    _d.sent();
                    return [4 /*yield*/, stagehandInstance.extract({
                            instruction: "Identify all required and optional input fields in the job application form, such as contact info, links, and resume uploads.",
                            schema: zod_1.z.object({
                                fields: zod_1.z.array(zod_1.z.object({
                                    name: zod_1.z.string().describe("Internal name or slug of the field"),
                                    label: zod_1.z.string().describe("Label of the field shown to the user"),
                                    type: zod_1.z.enum(["text", "file", "textarea", "select", "radio", "checkbox"]),
                                    required: zod_1.z.boolean(),
                                })),
                            }),
                        })];
                case 6:
                    result = _d.sent();
                    rawSessionId = ((_c = (_b = stagehandInstance.connectURL()) === null || _b === void 0 ? void 0 : _b.split("?")[0]) === null || _c === void 0 ? void 0 : _c.split("/").pop()) || "live-session";
                    sessionId = isLocal ? "local-session-detect-".concat(rawSessionId) : rawSessionId;
                    return [4 /*yield*/, stagehandInstance.close()];
                case 7:
                    _d.sent();
                    return [2 /*return*/, {
                            fields: result.fields,
                            sessionId: sessionId,
                        }];
                case 8:
                    err_1 = _d.sent();
                    console.error("Failed to run Stagehand field detection:", err_1);
                    if (!stagehandInstance) return [3 /*break*/, 12];
                    _d.label = 9;
                case 9:
                    _d.trys.push([9, 11, , 12]);
                    return [4 /*yield*/, stagehandInstance.close()];
                case 10:
                    _d.sent();
                    return [3 /*break*/, 12];
                case 11:
                    closeErr_1 = _d.sent();
                    console.error("Error closing stagehand:", closeErr_1);
                    return [3 /*break*/, 12];
                case 12:
                    console.log("Falling back to simulation mode due to error.");
                    return [2 /*return*/, runDetectionSimulation(platform)];
                case 13: return [2 /*return*/];
            }
        });
    });
}
/**
 * Automated form-filling and submission using Browserbase + Stagehand
 */
function submitJobApplication(jobUrl, platform, profile, resume, detectedFields, verifiedFields) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, mode, apiKey, projectId, isLocal, isHeadless, stagehandInstance, tempResumePath, requiresResume, Stagehand, page, chromium, browser, pwContext, pwPage, _i, detectedFields_1, field, fileInput, value, fieldName, fieldLabel, rawSessionId, sessionId, err_2, closeErr_2;
        var _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    _a = getAutomationMode(), mode = _a.mode, apiKey = _a.apiKey, projectId = _a.projectId;
                    if (mode === "SIMULATION") {
                        console.log("Using Simulation Mode for form submission.");
                        return [2 /*return*/, runSubmissionSimulation()];
                    }
                    isLocal = mode === "LOCAL";
                    isHeadless = process.env.STAGEHAND_HEADLESS === "true" || (isLocal ? false : true);
                    console.log("Running form submission in ".concat(mode, " mode (headless: ").concat(isHeadless, ")..."));
                    stagehandInstance = null;
                    tempResumePath = "";
                    _f.label = 1;
                case 1:
                    _f.trys.push([1, 24, , 29]);
                    requiresResume = detectedFields.some(function (f) { return f.type === "file" || f.name.includes("resume") || f.name.includes("cv"); });
                    if (!(requiresResume && resume)) return [3 /*break*/, 3];
                    return [4 /*yield*/, downloadResume(resume.file_url, resume.file_name)];
                case 2:
                    tempResumePath = _f.sent();
                    console.log("Resume downloaded locally to:", tempResumePath);
                    _f.label = 3;
                case 3: return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require("@browserbasehq/stagehand")); })];
                case 4:
                    Stagehand = (_f.sent()).Stagehand;
                    stagehandInstance = new Stagehand({
                        env: mode,
                        apiKey: isLocal ? undefined : apiKey,
                        projectId: isLocal ? undefined : projectId,
                        headless: isHeadless,
                        modelName: "google/gemini-2.0-flash",
                        modelClientOptions: {
                            apiKey: process.env.GEMINI_API_KEY,
                        },
                    });
                    return [4 /*yield*/, stagehandInstance.init()];
                case 5:
                    _f.sent();
                    page = stagehandInstance.context.activePage();
                    if (!page) {
                        throw new Error("Failed to get active browser page");
                    }
                    return [4 /*yield*/, page.goto(jobUrl)];
                case 6:
                    _f.sent();
                    return [4 /*yield*/, page.waitForLoadState("networkidle")];
                case 7:
                    _f.sent();
                    return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require("playwright-core")); })];
                case 8:
                    chromium = (_f.sent()).chromium;
                    return [4 /*yield*/, chromium.connectOverCDP(stagehandInstance.connectURL())];
                case 9:
                    browser = _f.sent();
                    pwContext = browser.contexts()[0];
                    pwPage = pwContext.pages()[0];
                    _i = 0, detectedFields_1 = detectedFields;
                    _f.label = 10;
                case 10:
                    if (!(_i < detectedFields_1.length)) return [3 /*break*/, 19];
                    field = detectedFields_1[_i];
                    if (!(field.type === "file")) return [3 /*break*/, 16];
                    if (!tempResumePath) return [3 /*break*/, 15];
                    console.log("Uploading resume to field: ".concat(field.label));
                    return [4 /*yield*/, pwPage.$("input[type=\"file\"]")];
                case 11:
                    fileInput = _f.sent();
                    if (!fileInput) return [3 /*break*/, 13];
                    return [4 /*yield*/, fileInput.setInputFiles(tempResumePath)];
                case 12:
                    _f.sent();
                    return [3 /*break*/, 15];
                case 13: 
                // Fallback Stagehand act
                return [4 /*yield*/, stagehandInstance.act("Upload my resume file to the \"".concat(field.label, "\" upload button"))];
                case 14:
                    // Fallback Stagehand act
                    _f.sent();
                    _f.label = 15;
                case 15: return [3 /*break*/, 18];
                case 16:
                    value = (verifiedFields === null || verifiedFields === void 0 ? void 0 : verifiedFields[field.name]) || "";
                    fieldName = field.name.toLowerCase();
                    fieldLabel = field.label.toLowerCase();
                    if (!value) {
                        if (fieldName.includes("first_name") || fieldLabel.includes("first name")) {
                            value = ((_b = profile.full_name) === null || _b === void 0 ? void 0 : _b.split(" ")[0]) || "";
                        }
                        else if (fieldName.includes("last_name") || fieldLabel.includes("last name")) {
                            value = ((_c = profile.full_name) === null || _c === void 0 ? void 0 : _c.split(" ").slice(1).join(" ")) || "";
                        }
                        else if (fieldName.includes("full_name") || fieldName === "name" || fieldLabel.includes("full name") || fieldLabel === "name") {
                            value = profile.full_name || "";
                        }
                        else if (fieldName.includes("email")) {
                            value = profile.email || "";
                        }
                        else if (fieldName === "phone" || fieldName.includes("phone_number") || fieldLabel.includes("phone")) {
                            value = profile.phone || "";
                        }
                        else if (fieldName === "company" || fieldName.includes("current_company") || fieldLabel.includes("company")) {
                            value = profile.current_company || "";
                        }
                        else if (fieldName === "title" || fieldName === "job_title" || fieldLabel.includes("job title") || fieldLabel === "title") {
                            value = profile.current_job_title || "";
                        }
                        else if (fieldName.includes("location") || fieldLabel.includes("location") || fieldLabel.includes("city")) {
                            value = profile.location || "";
                        }
                        else if (fieldName.includes("linkedin")) {
                            value = (profile.links || []).find(function (l) { return l.includes("linkedin.com"); }) || "";
                        }
                        else if (fieldName.includes("portfolio") || fieldName.includes("website") || fieldName.includes("github")) {
                            value = (profile.links || []).find(function (l) { return l.includes("github.com") || l.includes("portfolio") || !l.includes("linkedin.com"); }) || "";
                        }
                        else if (fieldName.includes("summary")) {
                            value = profile.summary || "";
                        }
                    }
                    if (!value) return [3 /*break*/, 18];
                    console.log("Filling field: ".concat(field.label, " with: ").concat(value));
                    // Use Stagehand natural language action
                    return [4 /*yield*/, stagehandInstance.act("Fill in the input field labeled \"".concat(field.label, "\" with \"").concat(value, "\""))];
                case 17:
                    // Use Stagehand natural language action
                    _f.sent();
                    _f.label = 18;
                case 18:
                    _i++;
                    return [3 /*break*/, 10];
                case 19:
                    // 4. Fill remaining custom/required fields via Stagehand AI
                    console.log("Asking Stagehand to review and fill out any remaining/custom fields...");
                    return [4 /*yield*/, stagehandInstance.act({
                            action: "Review the entire job form. Fill out any remaining blank input fields, radio buttons, select dropdowns, and checkboxes using the candidate's profile context: ".concat(JSON.stringify(profile), ".\n      For visa sponsorship questions (e.g. \"Do you require sponsorship?\", \"Will you now or in the future require visa...\"): choose \"No\" (or equivalent negative answer) unless specified otherwise.\n      For work authorization questions (e.g. \"Are you authorized to work...\"): choose \"Yes\" (or equivalent positive answer).\n      For demographic questions (gender, race, veteran, disability status): choose \"Decline to self-identify\", \"I do not wish to answer\", or appropriate options if required.\n      Do not leave any required fields blank.")
                        })];
                case 20:
                    _f.sent();
                    // 5. Submit
                    console.log("Submitting job application form...");
                    return [4 /*yield*/, stagehandInstance.act("Click the submit application button")];
                case 21:
                    _f.sent();
                    return [4 /*yield*/, page.waitForTimeout(3000)];
                case 22:
                    _f.sent(); // Wait for submission load
                    rawSessionId = ((_e = (_d = stagehandInstance.connectURL()) === null || _d === void 0 ? void 0 : _d.split("?")[0]) === null || _e === void 0 ? void 0 : _e.split("/").pop()) || "live-session";
                    sessionId = isLocal ? "local-session-submit-".concat(rawSessionId) : rawSessionId;
                    return [4 /*yield*/, stagehandInstance.close()];
                case 23:
                    _f.sent();
                    // Cleanup temp file
                    if (tempResumePath && fs_1.default.existsSync(tempResumePath)) {
                        fs_1.default.unlinkSync(tempResumePath);
                    }
                    return [2 /*return*/, {
                            success: true,
                            sessionId: sessionId,
                        }];
                case 24:
                    err_2 = _f.sent();
                    console.error("Failed to submit job application via Stagehand:", err_2);
                    if (!stagehandInstance) return [3 /*break*/, 28];
                    _f.label = 25;
                case 25:
                    _f.trys.push([25, 27, , 28]);
                    return [4 /*yield*/, stagehandInstance.close()];
                case 26:
                    _f.sent();
                    return [3 /*break*/, 28];
                case 27:
                    closeErr_2 = _f.sent();
                    console.error("Error closing stagehand:", closeErr_2);
                    return [3 /*break*/, 28];
                case 28:
                    if (tempResumePath && fs_1.default.existsSync(tempResumePath)) {
                        try {
                            fs_1.default.unlinkSync(tempResumePath);
                        }
                        catch (unlinkErr) {
                            console.error("Error deleting temp file:", unlinkErr);
                        }
                    }
                    return [2 /*return*/, {
                            success: false,
                            sessionId: isLocal ? "local-session-failed" : "failed-session",
                            error: err_2.message || "An unknown error occurred during form submission.",
                        }];
                case 29: return [2 /*return*/];
            }
        });
    });
}
/**
 * Mock Simulation: Field Detection
 */
function runDetectionSimulation(platform) {
    var normPlatform = platform.toLowerCase();
    var fields = [];
    if (normPlatform.includes("greenhouse")) {
        fields = [
            { name: "first_name", label: "First Name", type: "text", required: true },
            { name: "last_name", label: "Last Name", type: "text", required: true },
            { name: "email", label: "Email", type: "text", required: true },
            { name: "phone", label: "Phone", type: "text", required: true },
            { name: "resume", label: "Resume/CV", type: "file", required: true },
            { name: "linkedin", label: "LinkedIn Profile URL", type: "text", required: false },
            { name: "github", label: "GitHub URL", type: "text", required: false },
        ];
    }
    else if (normPlatform.includes("lever")) {
        fields = [
            { name: "resume", label: "Resume/CV", type: "file", required: true },
            { name: "full_name", label: "Full Name", type: "text", required: true },
            { name: "email", label: "Email", type: "text", required: true },
            { name: "phone", label: "Phone", type: "text", required: true },
            { name: "current_company", label: "Current Company", type: "text", required: false },
            { name: "linkedin", label: "LinkedIn URL", type: "text", required: false },
        ];
    }
    else if (normPlatform.includes("workable")) {
        fields = [
            { name: "first_name", label: "First Name", type: "text", required: true },
            { name: "last_name", label: "Last Name", type: "text", required: true },
            { name: "email", label: "Email Address", type: "text", required: true },
            { name: "phone", label: "Phone Number", type: "text", required: true },
            { name: "resume", label: "Resume", type: "file", required: true },
            { name: "location", label: "City", type: "text", required: false },
            { name: "linkedin", label: "LinkedIn Profile", type: "text", required: false },
        ];
    }
    else {
        // Other / generic
        fields = [
            { name: "full_name", label: "Full Name", type: "text", required: true },
            { name: "email", label: "Email", type: "text", required: true },
            { name: "resume", label: "Resume", type: "file", required: true },
        ];
    }
    var randomId = Math.random().toString(36).substring(2, 10);
    return {
        fields: fields,
        sessionId: "mock-session-detect-".concat(randomId),
    };
}
/**
 * Mock Simulation: Submission
 */
function runSubmissionSimulation() {
    var randomId = Math.random().toString(36).substring(2, 10);
    return {
        success: true,
        sessionId: "mock-session-submit-".concat(randomId),
    };
}
