"use client";
"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Field = Field;
exports.FieldLabel = FieldLabel;
exports.FieldDescription = FieldDescription;
exports.FieldError = FieldError;
exports.FieldGroup = FieldGroup;
exports.FieldLegend = FieldLegend;
exports.FieldSeparator = FieldSeparator;
exports.FieldSet = FieldSet;
exports.FieldContent = FieldContent;
exports.FieldTitle = FieldTitle;
var react_1 = require("react");
var class_variance_authority_1 = require("class-variance-authority");
var label_1 = require("./label");
var utils_1 = require("./lib/utils");
var separator_1 = require("./separator");
function FieldSet(_a) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return (<fieldset data-slot="field-set" className={(0, utils_1.cn)("flex flex-col gap-6", "has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3", className)} {...props}/>);
}
function FieldLegend(_a) {
    var className = _a.className, _b = _a.variant, variant = _b === void 0 ? "legend" : _b, props = __rest(_a, ["className", "variant"]);
    return (<legend data-slot="field-legend" data-variant={variant} className={(0, utils_1.cn)("mb-3 font-medium", "data-[variant=legend]:text-base", "data-[variant=label]:text-sm", className)} {...props}/>);
}
function FieldGroup(_a) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return (<div data-slot="field-group" className={(0, utils_1.cn)("group/field-group @container/field-group flex w-full flex-col gap-7 data-[slot=checkbox-group]:gap-3 [&>[data-slot=field-group]]:gap-4", className)} {...props}/>);
}
var fieldVariants = (0, class_variance_authority_1.cva)("group/field data-[invalid=true]:text-destructive flex w-full gap-3", {
    variants: {
        orientation: {
            vertical: ["flex-col [&>*]:w-full [&>.sr-only]:w-auto"],
            horizontal: [
                "flex-row items-center",
                "[&>[data-slot=field-label]]:flex-auto",
                "has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
            ],
            responsive: [
                "flex-col @md/field-group:flex-row @md/field-group:items-center [&>*]:w-full @md/field-group:[&>*]:w-auto [&>.sr-only]:w-auto",
                "@md/field-group:[&>[data-slot=field-label]]:flex-auto",
                "@md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
            ],
        },
    },
    defaultVariants: {
        orientation: "vertical",
    },
});
function Field(_a) {
    var className = _a.className, _b = _a.orientation, orientation = _b === void 0 ? "vertical" : _b, props = __rest(_a, ["className", "orientation"]);
    return (<div role="group" data-slot="field" data-orientation={orientation} className={(0, utils_1.cn)(fieldVariants({ orientation: orientation }), className)} {...props}/>);
}
function FieldContent(_a) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return (<div data-slot="field-content" className={(0, utils_1.cn)("group/field-content flex flex-1 flex-col gap-1.5 leading-snug", className)} {...props}/>);
}
function FieldLabel(_a) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return (<label_1.Label data-slot="field-label" className={(0, utils_1.cn)("group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50", "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-md has-[>[data-slot=field]]:border [&>*]:data-[slot=field]:p-4", "has-data-[state=checked]:bg-primary/5 has-data-[state=checked]:border-primary dark:has-data-[state=checked]:bg-primary/10", className)} {...props}/>);
}
function FieldTitle(_a) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return (<div data-slot="field-label" className={(0, utils_1.cn)("flex w-fit items-center gap-2 text-sm leading-snug font-medium group-data-[disabled=true]/field:opacity-50", className)} {...props}/>);
}
function FieldDescription(_a) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return (<p data-slot="field-description" className={(0, utils_1.cn)("text-muted-foreground text-sm leading-normal font-normal group-has-[[data-orientation=horizontal]]/field:text-balance", "last:mt-0 nth-last-2:-mt-1 [[data-variant=legend]+&]:-mt-1.5", "[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4", className)} {...props}/>);
}
function FieldSeparator(_a) {
    var children = _a.children, className = _a.className, props = __rest(_a, ["children", "className"]);
    return (<div data-slot="field-separator" data-content={!!children} className={(0, utils_1.cn)("relative -my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2", className)} {...props}>
      <separator_1.Separator className="absolute inset-0 top-1/2"/>
      {children && (<span className="bg-background text-muted-foreground relative mx-auto block w-fit px-2" data-slot="field-separator-content">
          {children}
        </span>)}
    </div>);
}
function FieldError(_a) {
    var className = _a.className, children = _a.children, errors = _a.errors, props = __rest(_a, ["className", "children", "errors"]);
    var content = (0, react_1.useMemo)(function () {
        var _a;
        if (children) {
            return children;
        }
        if (!(errors === null || errors === void 0 ? void 0 : errors.length)) {
            return null;
        }
        var uniqueErrors = __spreadArray([], new Map(errors.map(function (error) { return [error === null || error === void 0 ? void 0 : error.message, error]; })).values(), true);
        if ((uniqueErrors === null || uniqueErrors === void 0 ? void 0 : uniqueErrors.length) == 1) {
            return (_a = uniqueErrors[0]) === null || _a === void 0 ? void 0 : _a.message;
        }
        return (<ul className="ml-4 flex list-disc flex-col gap-1">
        {uniqueErrors.map(function (error, index) {
                return (error === null || error === void 0 ? void 0 : error.message) && <li key={index}>{error.message}</li>;
            })}
      </ul>);
    }, [children, errors]);
    if (!content) {
        return null;
    }
    return (<div role="alert" data-slot="field-error" className={(0, utils_1.cn)("text-destructive text-sm font-normal", className)} {...props}>
      {content}
    </div>);
}
