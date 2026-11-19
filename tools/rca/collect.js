"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var path_1 = require("path");
function collectFailures() {
    return __awaiter(this, void 0, void 0, function () {
        var resultsPath, outputDir, outputPath, rawData, json, failures, traverseSuites;
        return __generator(this, function (_a) {
            console.log('[RCA Collector] Starting failure collection...');
            resultsPath = path_1.default.join(process.cwd(), 'test-results', 'results.json');
            outputDir = path_1.default.join(process.cwd(), 'reports', 'rca');
            outputPath = path_1.default.join(outputDir, 'failures.json');
            if (!fs_1.default.existsSync(resultsPath)) {
                console.warn('[RCA Collector] No results.json found. Tests may not have run yet.');
                process.exit(0);
            }
            // Ensure output directory exists
            if (!fs_1.default.existsSync(outputDir)) {
                fs_1.default.mkdirSync(outputDir, { recursive: true });
            }
            rawData = fs_1.default.readFileSync(resultsPath, 'utf-8');
            json = JSON.parse(rawData);
            failures = [];
            traverseSuites = function (suites) {
                var _a, _b, _c;
                for (var _i = 0, suites_1 = suites; _i < suites_1.length; _i++) {
                    var suite = suites_1[_i];
                    if (suite.specs) {
                        for (var _d = 0, _e = suite.specs; _d < _e.length; _d++) {
                            var spec = _e[_d];
                            for (var _f = 0, _g = spec.tests; _f < _g.length; _f++) {
                                var test = _g[_f];
                                if (test.status === 'unexpected' || test.status === 'flaky') {
                                    // Extract scenario ID from title (e.g., "AE-01: Account registration")
                                    var title = spec.title;
                                    var scenarioIdMatch = title.match(/AE-\d+/);
                                    var scenarioId = scenarioIdMatch ? scenarioIdMatch[0] : 'UNKNOWN';
                                    var error = (_a = test.results[0]) === null || _a === void 0 ? void 0 : _a.error;
                                    var traceAttachment = (_c = (_b = test.results[0]) === null || _b === void 0 ? void 0 : _b.attachments) === null || _c === void 0 ? void 0 : _c.find(function (a) { return a.name === 'trace'; });
                                    failures.push({
                                        scenarioId: scenarioId,
                                        testTitle: title,
                                        errorMessage: (error === null || error === void 0 ? void 0 : error.message) || 'No error message provided',
                                        stackTrace: (error === null || error === void 0 ? void 0 : error.stack) || 'No stack trace',
                                        status: test.status,
                                        tracePath: traceAttachment ? traceAttachment.path : undefined,
                                    });
                                }
                            }
                        }
                    }
                    if (suite.suites) {
                        traverseSuites(suite.suites);
                    }
                }
            };
            if (json.suites) {
                traverseSuites(json.suites);
            }
            fs_1.default.writeFileSync(outputPath, JSON.stringify(failures, null, 2));
            console.log("[RCA Collector] Found ".concat(failures.length, " failures. Saved to ").concat(outputPath));
            return [2 /*return*/];
        });
    });
}
collectFailures().catch(function (e) {
    console.error('[RCA Collector] Fatal error:', e);
    process.exit(1);
});
