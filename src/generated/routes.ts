/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import {  fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { HealthController } from './../health.controller.js';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { VisualController } from './../modules/visual/controller/visual.controller.js';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ReportController } from './../modules/reports/report.controller.js';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { CurationPostController } from './../modules/curation-posts/controller/curation-post.controller.js';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { MyCurationBookmarkController } from './../modules/curation-posts/controller/curation-post.controller.js';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ConditionController } from './../modules/conditions/condition.controller.js';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AuthController } from './../modules/auth/controller/auth.controller.js';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AudioController } from './../modules/audio/controller/audio.controller.js';
import { expressAuthentication } from './../common/middlewares/tsoa.authentication.js';
// @ts-ignore - no great way to install types from subpackage
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from 'express';

const expressAuthenticationRecasted = expressAuthentication as (req: ExRequest, securityName: string, scopes?: string[], res?: ExResponse) => Promise<any>;


// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "ApiSuccessResponse__status-string__": {
        "dataType": "refObject",
        "properties": {
            "isSuccess": {"dataType":"enum","enums":[true],"required":true},
            "code": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "result": {"dataType":"nestedObjectLiteral","nestedProperties":{"status":{"dataType":"string","required":true}},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "VisualGuideFileResponse": {
        "dataType": "refObject",
        "properties": {
            "visualKey": {"dataType":"string","required":true},
            "fileUrl": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiSuccessResponse_VisualGuideFileResponse_": {
        "dataType": "refObject",
        "properties": {
            "isSuccess": {"dataType":"enum","enums":[true],"required":true},
            "code": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "result": {"ref":"VisualGuideFileResponse","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiErrorResponse": {
        "dataType": "refObject",
        "properties": {
            "isSuccess": {"dataType":"enum","enums":[false],"required":true},
            "code": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "result": {"dataType":"any","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "DailyScoreDto": {
        "dataType": "refObject",
        "properties": {
            "day": {"dataType":"string","required":true},
            "score": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TopTriggerDto": {
        "dataType": "refObject",
        "properties": {
            "rank": {"dataType":"double","required":true},
            "trigger": {"dataType":"string","required":true},
            "count": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "WeeklyReportDto": {
        "dataType": "refObject",
        "properties": {
            "averageScore": {"dataType":"double","required":true},
            "hardestDay": {"dataType":"string","required":true},
            "hardestScore": {"dataType":"double","required":true},
            "pauzeCount": {"dataType":"double","required":true},
            "scoreChange": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
            "dailyScores": {"dataType":"array","array":{"dataType":"refObject","ref":"DailyScoreDto"},"required":true},
            "topTriggers": {"dataType":"array","array":{"dataType":"refObject","ref":"TopTriggerDto"},"required":true},
            "insights": {"dataType":"array","array":{"dataType":"string"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiSuccessResponse_WeeklyReportDto_": {
        "dataType": "refObject",
        "properties": {
            "isSuccess": {"dataType":"enum","enums":[true],"required":true},
            "code": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "result": {"ref":"WeeklyReportDto","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ReportErrorResponseDto": {
        "dataType": "refObject",
        "properties": {
            "isSuccess": {"dataType":"enum","enums":[false],"required":true},
            "code": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "result": {"dataType":"array","array":{"dataType":"any"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "WeeklyScoreDto": {
        "dataType": "refObject",
        "properties": {
            "week": {"dataType":"string","required":true},
            "averageScore": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MonthlyReportDto": {
        "dataType": "refObject",
        "properties": {
            "averageScore": {"dataType":"double","required":true},
            "hardestWeek": {"dataType":"string","required":true},
            "hardestScore": {"dataType":"double","required":true},
            "pauzeCount": {"dataType":"double","required":true},
            "scoreChange": {"dataType":"union","subSchemas":[{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
            "weeklyScores": {"dataType":"array","array":{"dataType":"refObject","ref":"WeeklyScoreDto"},"required":true},
            "topTriggers": {"dataType":"array","array":{"dataType":"refObject","ref":"TopTriggerDto"},"required":true},
            "insights": {"dataType":"array","array":{"dataType":"string"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiSuccessResponse_MonthlyReportDto_": {
        "dataType": "refObject",
        "properties": {
            "isSuccess": {"dataType":"enum","enums":[true],"required":true},
            "code": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "result": {"ref":"MonthlyReportDto","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CurationPostListItem": {
        "dataType": "refObject",
        "properties": {
            "postId": {"dataType":"double","required":true},
            "categoryId": {"dataType":"double","required":true},
            "categoryName": {"dataType":"string","required":true},
            "title": {"dataType":"string","required":true},
            "estimatedReadTime": {"dataType":"double","required":true},
            "summary": {"dataType":"string","required":true},
            "source": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "thumbnailUrl": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "viewCount": {"dataType":"double","required":true},
            "likeCount": {"dataType":"double","required":true},
            "isLiked": {"dataType":"boolean","required":true},
            "isBookmarked": {"dataType":"boolean","required":true},
            "createdAt": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CurationPostListResult": {
        "dataType": "refObject",
        "properties": {
            "content": {"dataType":"array","array":{"dataType":"refObject","ref":"CurationPostListItem"},"required":true},
            "page": {"dataType":"double","required":true},
            "size": {"dataType":"double","required":true},
            "totalElements": {"dataType":"double","required":true},
            "totalPages": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiSuccessResponse_CurationPostListResult_": {
        "dataType": "refObject",
        "properties": {
            "isSuccess": {"dataType":"enum","enums":[true],"required":true},
            "code": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "result": {"ref":"CurationPostListResult","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CurationPostDetailResult": {
        "dataType": "refObject",
        "properties": {
            "postId": {"dataType":"double","required":true},
            "categoryId": {"dataType":"double","required":true},
            "categoryName": {"dataType":"string","required":true},
            "title": {"dataType":"string","required":true},
            "content": {"dataType":"string","required":true},
            "source": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "thumbnailUrl": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "viewCount": {"dataType":"double","required":true},
            "likeCount": {"dataType":"double","required":true},
            "estimatedReadTime": {"dataType":"double","required":true},
            "isPublished": {"dataType":"boolean","required":true},
            "isLiked": {"dataType":"boolean","required":true},
            "isBookmarked": {"dataType":"boolean","required":true},
            "createdAt": {"dataType":"string","required":true},
            "updatedAt": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiSuccessResponse_CurationPostDetailResult_": {
        "dataType": "refObject",
        "properties": {
            "isSuccess": {"dataType":"enum","enums":[true],"required":true},
            "code": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "result": {"ref":"CurationPostDetailResult","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateCurationPostResult": {
        "dataType": "refObject",
        "properties": {
            "postId": {"dataType":"double","required":true},
            "categoryId": {"dataType":"double","required":true},
            "title": {"dataType":"string","required":true},
            "createdAt": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiSuccessResponse_CreateCurationPostResult_": {
        "dataType": "refObject",
        "properties": {
            "isSuccess": {"dataType":"enum","enums":[true],"required":true},
            "code": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "result": {"ref":"CreateCurationPostResult","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateCurationPostRequest": {
        "dataType": "refObject",
        "properties": {
            "categoryId": {"dataType":"double","required":true},
            "title": {"dataType":"string","required":true},
            "content": {"dataType":"string","required":true},
            "source": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "thumbnailUrl": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "isPublished": {"dataType":"boolean"},
            "estimatedReadTime": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateCurationPostResult": {
        "dataType": "refObject",
        "properties": {
            "postId": {"dataType":"double","required":true},
            "categoryId": {"dataType":"double","required":true},
            "title": {"dataType":"string","required":true},
            "updatedAt": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiSuccessResponse_UpdateCurationPostResult_": {
        "dataType": "refObject",
        "properties": {
            "isSuccess": {"dataType":"enum","enums":[true],"required":true},
            "code": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "result": {"ref":"UpdateCurationPostResult","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateCurationPostRequest": {
        "dataType": "refObject",
        "properties": {
            "categoryId": {"dataType":"double"},
            "title": {"dataType":"string"},
            "content": {"dataType":"string"},
            "source": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "thumbnailUrl": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "isPublished": {"dataType":"boolean"},
            "estimatedReadTime": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiSuccessResponse_null_": {
        "dataType": "refObject",
        "properties": {
            "isSuccess": {"dataType":"enum","enums":[true],"required":true},
            "code": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "result": {"dataType":"enum","enums":[null],"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CurationPostLikeResult": {
        "dataType": "refObject",
        "properties": {
            "postId": {"dataType":"double","required":true},
            "liked": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiSuccessResponse_CurationPostLikeResult_": {
        "dataType": "refObject",
        "properties": {
            "isSuccess": {"dataType":"enum","enums":[true],"required":true},
            "code": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "result": {"ref":"CurationPostLikeResult","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CurationPostBookmarkResult": {
        "dataType": "refObject",
        "properties": {
            "postId": {"dataType":"double","required":true},
            "bookmarked": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiSuccessResponse_CurationPostBookmarkResult_": {
        "dataType": "refObject",
        "properties": {
            "isSuccess": {"dataType":"enum","enums":[true],"required":true},
            "code": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "result": {"ref":"CurationPostBookmarkResult","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MyBookmarkListItem": {
        "dataType": "refObject",
        "properties": {
            "bookmarkId": {"dataType":"double","required":true},
            "postId": {"dataType":"double","required":true},
            "categoryId": {"dataType":"double","required":true},
            "categoryName": {"dataType":"string","required":true},
            "title": {"dataType":"string","required":true},
            "estimatedReadTime": {"dataType":"double","required":true},
            "summary": {"dataType":"string","required":true},
            "thumbnailUrl": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "createdAt": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "MyBookmarkListResult": {
        "dataType": "refObject",
        "properties": {
            "content": {"dataType":"array","array":{"dataType":"refObject","ref":"MyBookmarkListItem"},"required":true},
            "page": {"dataType":"double","required":true},
            "size": {"dataType":"double","required":true},
            "totalElements": {"dataType":"double","required":true},
            "totalPages": {"dataType":"double","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiSuccessResponse_MyBookmarkListResult_": {
        "dataType": "refObject",
        "properties": {
            "isSuccess": {"dataType":"enum","enums":[true],"required":true},
            "code": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "result": {"ref":"MyBookmarkListResult","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SensitivityLevel": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["LOW"]},{"dataType":"enum","enums":["NORMAL"]},{"dataType":"enum","enums":["HIGH"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TriggerCode": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["SLEEP_DEPRIVATION"]},{"dataType":"enum","enums":["NOISE_EXPOSURE"]},{"dataType":"enum","enums":["VISUAL_STIMULATION"]},{"dataType":"enum","enums":["SOCIAL_ISOLATION"]},{"dataType":"enum","enums":["LOW_ENERGY"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateTodayConditionResponseDto": {
        "dataType": "refObject",
        "properties": {
            "conditionId": {"dataType":"double","required":true},
            "sensitivityScore": {"dataType":"double","required":true},
            "sensitivityLevel": {"ref":"SensitivityLevel","required":true},
            "triggerCodes": {"dataType":"array","array":{"dataType":"refAlias","ref":"TriggerCode"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiSuccessResponse_CreateTodayConditionResponseDto_": {
        "dataType": "refObject",
        "properties": {
            "isSuccess": {"dataType":"enum","enums":[true],"required":true},
            "code": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "result": {"ref":"CreateTodayConditionResponseDto","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ConditionErrorResponseDto": {
        "dataType": "refObject",
        "properties": {
            "isSuccess": {"dataType":"enum","enums":[false],"required":true},
            "code": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "result": {"dataType":"array","array":{"dataType":"any"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SleepLevel": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["OVER_8"]},{"dataType":"enum","enums":["SIX_TO_EIGHT"]},{"dataType":"enum","enums":["FOUR_TO_SIX"]},{"dataType":"enum","enums":["LESS_4"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "NoiseLevel": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["QUIET"]},{"dataType":"enum","enums":["NORMAL"]},{"dataType":"enum","enums":["UNCOMFORTABLE"]},{"dataType":"enum","enums":["HARD"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "VisualLevel": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["LOW"]},{"dataType":"enum","enums":["NORMAL"]},{"dataType":"enum","enums":["HIGH"]},{"dataType":"enum","enums":["VERY_HIGH"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SocialLevel": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["MANY"]},{"dataType":"enum","enums":["SOME"]},{"dataType":"enum","enums":["LITTLE"]},{"dataType":"enum","enums":["ALONE"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "EnergyLevel": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["ENOUGH"]},{"dataType":"enum","enums":["NORMAL"]},{"dataType":"enum","enums":["LOW"]},{"dataType":"enum","enums":["NONE"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateTodayConditionRequestDto": {
        "dataType": "refObject",
        "properties": {
            "sleepLevel": {"ref":"SleepLevel","required":true},
            "noiseLevel": {"ref":"NoiseLevel","required":true},
            "visualLevel": {"ref":"VisualLevel","required":true},
            "socialLevel": {"ref":"SocialLevel","required":true},
            "energyLevel": {"ref":"EnergyLevel","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AuthUserDto": {
        "dataType": "refObject",
        "properties": {
            "uid": {"dataType":"string","required":true},
            "email": {"dataType":"string","required":true},
            "nickname": {"dataType":"string","required":true},
            "birth": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AuthTokenResultDto": {
        "dataType": "refObject",
        "properties": {
            "accessToken": {"dataType":"string","required":true},
            "refreshToken": {"dataType":"string","required":true},
            "user": {"ref":"AuthUserDto","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiSuccessResponse_AuthTokenResultDto_": {
        "dataType": "refObject",
        "properties": {
            "isSuccess": {"dataType":"enum","enums":[true],"required":true},
            "code": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "result": {"ref":"AuthTokenResultDto","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "TermAgreementDto": {
        "dataType": "refObject",
        "properties": {
            "termId": {"dataType":"double","required":true},
            "agreed": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LocalSignupRequestDto": {
        "dataType": "refObject",
        "properties": {
            "email": {"dataType":"string","required":true},
            "password": {"dataType":"string","required":true},
            "nickname": {"dataType":"string","required":true},
            "birth": {"dataType":"string","required":true},
            "termAgreements": {"dataType":"array","array":{"dataType":"refObject","ref":"TermAgreementDto"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LocalLoginRequestDto": {
        "dataType": "refObject",
        "properties": {
            "email": {"dataType":"string","required":true},
            "password": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RefreshTokenResultDto": {
        "dataType": "refObject",
        "properties": {
            "accessToken": {"dataType":"string","required":true},
            "refreshToken": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiSuccessResponse_RefreshTokenResultDto_": {
        "dataType": "refObject",
        "properties": {
            "isSuccess": {"dataType":"enum","enums":[true],"required":true},
            "code": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "result": {"ref":"RefreshTokenResultDto","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "RefreshTokenRequestDto": {
        "dataType": "refObject",
        "properties": {
            "refreshToken": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AuthMeResultDto": {
        "dataType": "refObject",
        "properties": {
            "uid": {"dataType":"string","required":true},
            "email": {"dataType":"string","required":true},
            "nickname": {"dataType":"string","required":true},
            "birth": {"dataType":"string","required":true},
            "role": {"dataType":"string","required":true},
            "socialTypes": {"dataType":"array","array":{"dataType":"string"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiSuccessResponse_AuthMeResultDto_": {
        "dataType": "refObject",
        "properties": {
            "isSuccess": {"dataType":"enum","enums":[true],"required":true},
            "code": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "result": {"ref":"AuthMeResultDto","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AudioGuidePublicItem": {
        "dataType": "refObject",
        "properties": {
            "audioId": {"dataType":"double","required":true},
            "audioTitle": {"dataType":"string","required":true},
            "categoryId": {"dataType":"double","required":true},
            "categoryName": {"dataType":"string","required":true},
            "fileUrl": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AudioGuideAuthenticatedItem": {
        "dataType": "refObject",
        "properties": {
            "audioId": {"dataType":"double","required":true},
            "audioTitle": {"dataType":"string","required":true},
            "categoryId": {"dataType":"double","required":true},
            "categoryName": {"dataType":"string","required":true},
            "fileUrl": {"dataType":"string","required":true},
            "isLiked": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AudioGuideListItem": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"AudioGuidePublicItem"},{"ref":"AudioGuideAuthenticatedItem"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiSuccessResponse_AudioGuideListItem-Array_": {
        "dataType": "refObject",
        "properties": {
            "isSuccess": {"dataType":"enum","enums":[true],"required":true},
            "code": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "result": {"dataType":"array","array":{"dataType":"refAlias","ref":"AudioGuideListItem"},"required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AudioCategoryCode": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["NATURE_SOUND"]},{"dataType":"enum","enums":["ASMR"]},{"dataType":"enum","enums":["NOISE"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AudioSaveResult": {
        "dataType": "refObject",
        "properties": {
            "audioId": {"dataType":"double","required":true},
            "isSaved": {"dataType":"boolean","required":true},
            "audioUrl": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiSuccessResponse_AudioSaveResult_": {
        "dataType": "refObject",
        "properties": {
            "isSuccess": {"dataType":"enum","enums":[true],"required":true},
            "code": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "result": {"ref":"AudioSaveResult","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "AudioLikeToggleResult": {
        "dataType": "refObject",
        "properties": {
            "audioId": {"dataType":"double","required":true},
            "isLiked": {"dataType":"boolean","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiSuccessResponse_AudioLikeToggleResult_": {
        "dataType": "refObject",
        "properties": {
            "isSuccess": {"dataType":"enum","enums":[true],"required":true},
            "code": {"dataType":"string","required":true},
            "message": {"dataType":"string","required":true},
            "result": {"ref":"AudioLikeToggleResult","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new ExpressTemplateService(models, {"noImplicitAdditionalProperties":"throw-on-extras","bodyCoercion":true});

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa




export function RegisterRoutes(app: Router) {

    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################


    
        const argsHealthController_getHealth: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/health',
            ...(fetchMiddlewares<RequestHandler>(HealthController)),
            ...(fetchMiddlewares<RequestHandler>(HealthController.prototype.getHealth)),

            async function HealthController_getHealth(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsHealthController_getHealth, request, response });

                const controller = new HealthController();

              await templateService.apiHandler({
                methodName: 'getHealth',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsVisualController_getGuideByKey: Record<string, TsoaRoute.ParameterSchema> = {
                key: {"in":"query","name":"key","required":true,"dataType":"string"},
        };
        app.get('/visual-guides/file',
            ...(fetchMiddlewares<RequestHandler>(VisualController)),
            ...(fetchMiddlewares<RequestHandler>(VisualController.prototype.getGuideByKey)),

            async function VisualController_getGuideByKey(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsVisualController_getGuideByKey, request, response });

                const controller = new VisualController();

              await templateService.apiHandler({
                methodName: 'getGuideByKey',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsReportController_weekly: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/reports/weekly',
            authenticateMiddleware([{"bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ReportController)),
            ...(fetchMiddlewares<RequestHandler>(ReportController.prototype.weekly)),

            async function ReportController_weekly(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsReportController_weekly, request, response });

                const controller = new ReportController();

              await templateService.apiHandler({
                methodName: 'weekly',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsReportController_monthly: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/reports/monthly',
            authenticateMiddleware([{"bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ReportController)),
            ...(fetchMiddlewares<RequestHandler>(ReportController.prototype.monthly)),

            async function ReportController_monthly(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsReportController_monthly, request, response });

                const controller = new ReportController();

              await templateService.apiHandler({
                methodName: 'monthly',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCurationPostController_getCurationPosts: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                categoryId: {"in":"query","name":"categoryId","dataType":"double"},
                keyword: {"in":"query","name":"keyword","dataType":"string"},
                page: {"default":1,"in":"query","name":"page","dataType":"double"},
                size: {"default":10,"in":"query","name":"size","dataType":"double"},
        };
        app.get('/curation-posts',
            ...(fetchMiddlewares<RequestHandler>(CurationPostController)),
            ...(fetchMiddlewares<RequestHandler>(CurationPostController.prototype.getCurationPosts)),

            async function CurationPostController_getCurationPosts(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCurationPostController_getCurationPosts, request, response });

                const controller = new CurationPostController();

              await templateService.apiHandler({
                methodName: 'getCurationPosts',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCurationPostController_getCurationPostDetail: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                postId: {"in":"path","name":"postId","required":true,"dataType":"string"},
        };
        app.get('/curation-posts/:postId',
            ...(fetchMiddlewares<RequestHandler>(CurationPostController)),
            ...(fetchMiddlewares<RequestHandler>(CurationPostController.prototype.getCurationPostDetail)),

            async function CurationPostController_getCurationPostDetail(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCurationPostController_getCurationPostDetail, request, response });

                const controller = new CurationPostController();

              await templateService.apiHandler({
                methodName: 'getCurationPostDetail',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCurationPostController_createCurationPost: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"ref":"CreateCurationPostRequest"},
        };
        app.post('/curation-posts',
            authenticateMiddleware([{"bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CurationPostController)),
            ...(fetchMiddlewares<RequestHandler>(CurationPostController.prototype.createCurationPost)),

            async function CurationPostController_createCurationPost(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCurationPostController_createCurationPost, request, response });

                const controller = new CurationPostController();

              await templateService.apiHandler({
                methodName: 'createCurationPost',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCurationPostController_updateCurationPost: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                postId: {"in":"path","name":"postId","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateCurationPostRequest"},
        };
        app.patch('/curation-posts/:postId',
            authenticateMiddleware([{"bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CurationPostController)),
            ...(fetchMiddlewares<RequestHandler>(CurationPostController.prototype.updateCurationPost)),

            async function CurationPostController_updateCurationPost(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCurationPostController_updateCurationPost, request, response });

                const controller = new CurationPostController();

              await templateService.apiHandler({
                methodName: 'updateCurationPost',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCurationPostController_deleteCurationPost: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                postId: {"in":"path","name":"postId","required":true,"dataType":"string"},
        };
        app.delete('/curation-posts/:postId',
            authenticateMiddleware([{"bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CurationPostController)),
            ...(fetchMiddlewares<RequestHandler>(CurationPostController.prototype.deleteCurationPost)),

            async function CurationPostController_deleteCurationPost(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCurationPostController_deleteCurationPost, request, response });

                const controller = new CurationPostController();

              await templateService.apiHandler({
                methodName: 'deleteCurationPost',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCurationPostController_toggleCurationPostLike: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                postId: {"in":"path","name":"postId","required":true,"dataType":"string"},
        };
        app.patch('/curation-posts/:postId/likes',
            authenticateMiddleware([{"bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CurationPostController)),
            ...(fetchMiddlewares<RequestHandler>(CurationPostController.prototype.toggleCurationPostLike)),

            async function CurationPostController_toggleCurationPostLike(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCurationPostController_toggleCurationPostLike, request, response });

                const controller = new CurationPostController();

              await templateService.apiHandler({
                methodName: 'toggleCurationPostLike',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsCurationPostController_toggleCurationPostBookmark: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                postId: {"in":"path","name":"postId","required":true,"dataType":"string"},
        };
        app.patch('/curation-posts/:postId/bookmarks',
            authenticateMiddleware([{"bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(CurationPostController)),
            ...(fetchMiddlewares<RequestHandler>(CurationPostController.prototype.toggleCurationPostBookmark)),

            async function CurationPostController_toggleCurationPostBookmark(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsCurationPostController_toggleCurationPostBookmark, request, response });

                const controller = new CurationPostController();

              await templateService.apiHandler({
                methodName: 'toggleCurationPostBookmark',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsMyCurationBookmarkController_getMyBookmarks: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                page: {"default":1,"in":"query","name":"page","dataType":"double"},
                size: {"default":10,"in":"query","name":"size","dataType":"double"},
        };
        app.get('/users/me/bookmarks',
            authenticateMiddleware([{"bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(MyCurationBookmarkController)),
            ...(fetchMiddlewares<RequestHandler>(MyCurationBookmarkController.prototype.getMyBookmarks)),

            async function MyCurationBookmarkController_getMyBookmarks(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsMyCurationBookmarkController_getMyBookmarks, request, response });

                const controller = new MyCurationBookmarkController();

              await templateService.apiHandler({
                methodName: 'getMyBookmarks',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsConditionController_createToday: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                body: {"in":"body","name":"body","required":true,"ref":"CreateTodayConditionRequestDto"},
        };
        app.post('/conditions/today',
            authenticateMiddleware([{"bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(ConditionController)),
            ...(fetchMiddlewares<RequestHandler>(ConditionController.prototype.createToday)),

            async function ConditionController_createToday(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsConditionController_createToday, request, response });

                const controller = new ConditionController();

              await templateService.apiHandler({
                methodName: 'createToday',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_signup: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"LocalSignupRequestDto"},
        };
        app.post('/auth/signup',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.signup)),

            async function AuthController_signup(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_signup, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'signup',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_login: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"LocalLoginRequestDto"},
        };
        app.post('/auth/login',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.login)),

            async function AuthController_login(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_login, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'login',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_refresh: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"RefreshTokenRequestDto"},
        };
        app.post('/auth/refresh',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.refresh)),

            async function AuthController_refresh(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_refresh, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'refresh',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_getMe: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/auth/me',
            authenticateMiddleware([{"bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.getMe)),

            async function AuthController_getMe(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_getMe, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'getMe',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAudioController_getAllGuides: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
        };
        app.get('/audio-guides',
            ...(fetchMiddlewares<RequestHandler>(AudioController)),
            ...(fetchMiddlewares<RequestHandler>(AudioController.prototype.getAllGuides)),

            async function AudioController_getAllGuides(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAudioController_getAllGuides, request, response });

                const controller = new AudioController();

              await templateService.apiHandler({
                methodName: 'getAllGuides',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAudioController_getAudioGuidesByCategory: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                categoryCode: {"in":"query","name":"categoryCode","required":true,"ref":"AudioCategoryCode"},
        };
        app.get('/audio-guides/categories',
            ...(fetchMiddlewares<RequestHandler>(AudioController)),
            ...(fetchMiddlewares<RequestHandler>(AudioController.prototype.getAudioGuidesByCategory)),

            async function AudioController_getAudioGuidesByCategory(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAudioController_getAudioGuidesByCategory, request, response });

                const controller = new AudioController();

              await templateService.apiHandler({
                methodName: 'getAudioGuidesByCategory',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAudioController_saveAudioGuide: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                audioId: {"in":"path","name":"audioId","required":true,"dataType":"string"},
        };
        app.post('/audio-guides/:audioId/saves',
            authenticateMiddleware([{"bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AudioController)),
            ...(fetchMiddlewares<RequestHandler>(AudioController.prototype.saveAudioGuide)),

            async function AudioController_saveAudioGuide(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAudioController_saveAudioGuide, request, response });

                const controller = new AudioController();

              await templateService.apiHandler({
                methodName: 'saveAudioGuide',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAudioController_toggleAudioLike: Record<string, TsoaRoute.ParameterSchema> = {
                request: {"in":"request","name":"request","required":true,"dataType":"object"},
                audioId: {"in":"path","name":"audioId","required":true,"dataType":"string"},
        };
        app.patch('/audio-guides/:audioId/likes',
            authenticateMiddleware([{"bearer":[]}]),
            ...(fetchMiddlewares<RequestHandler>(AudioController)),
            ...(fetchMiddlewares<RequestHandler>(AudioController.prototype.toggleAudioLike)),

            async function AudioController_toggleAudioLike(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAudioController_toggleAudioLike, request, response });

                const controller = new AudioController();

              await templateService.apiHandler({
                methodName: 'toggleAudioLike',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function authenticateMiddleware(security: TsoaRoute.Security[] = []) {
        return async function runAuthenticationMiddleware(request: any, response: any, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            // keep track of failed auth attempts so we can hand back the most
            // recent one.  This behavior was previously existing so preserving it
            // here
            const failedAttempts: any[] = [];
            const pushAndRethrow = (error: any) => {
                failedAttempts.push(error);
                throw error;
            };

            const secMethodOrPromises: Promise<any>[] = [];
            for (const secMethod of security) {
                if (Object.keys(secMethod).length > 1) {
                    const secMethodAndPromises: Promise<any>[] = [];

                    for (const name in secMethod) {
                        secMethodAndPromises.push(
                            expressAuthenticationRecasted(request, name, secMethod[name], response)
                                .catch(pushAndRethrow)
                        );
                    }

                    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

                    secMethodOrPromises.push(Promise.all(secMethodAndPromises)
                        .then(users => { return users[0]; }));
                } else {
                    for (const name in secMethod) {
                        secMethodOrPromises.push(
                            expressAuthenticationRecasted(request, name, secMethod[name], response)
                                .catch(pushAndRethrow)
                        );
                    }
                }
            }

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            try {
                request['user'] = await Promise.any(secMethodOrPromises);

                // Response was sent in middleware, abort
                if (response.writableEnded) {
                    return;
                }

                next();
            }
            catch(err) {
                // Show most recent error as response
                const error = failedAttempts.pop();
                error.status = error.status || 401;

                // Response was sent in middleware, abort
                if (response.writableEnded) {
                    return;
                }
                next(error);
            }

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        }
    }

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
