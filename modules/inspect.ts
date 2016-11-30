import * as util from "util";

export default function inspect(arg1: string | any, arg2?) {
    const isString = typeof(arg1) === "string";

    if (typeof(arg1) === "string" && !!arg2) {
        console.log(arg1, util.inspect(arg2, { colors: true }));
    } else if (typeof(arg1) === "string") {
        console.log(arg1);
    } else {
        console.log(util.inspect(arg1, { colors: true }));
    }
}