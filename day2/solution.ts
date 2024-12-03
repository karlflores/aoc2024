
import {promises as fs} from 'fs'
type Report = number[]
type ReportValidator = (r: Report) => boolean;
type ValidRules = ReportValidator[];

async function parseInput(path: string): Promise<Report[]> {
    const delimiter = " ";
    const fileData = await fs.readFile(path, 'ascii');
    const lines = fileData.split("\n");
    return lines.map(line => {
        const nums = line.split(delimiter).map(l => l.trimEnd());
        return nums.map(n => parseInt(n));
    });
}

function IncreasingReport(report: Report): boolean {
    for(let i = 1 ; i < report.length ; i++ ){
        if(report[i] < report[i-1]){
            return false;
        }
    }
    return true;
}

function DecreasingReport(report: Report): boolean {
    for(let i = 1 ; i < report.length ; i++ ){
        if(report[i] > report[i-1]){
            return false;
        }
    }
    return true;
}

function ValidSeparation(report: Report): boolean {
    for(let i = 1 ; i < report.length ; i++ ){
        const diff = Math.abs(report[i] - report[i-1]);
        if(diff < 1 || diff > 3){
            return false;
        }
    }
    return true;
}


function ValidOrder(report: Report): boolean {
    return DecreasingReport(report) || IncreasingReport(report);
}

export default function(): void {
    parseInput("day2/input.txt").then(d => {
        const validRules: ValidRules = [ValidSeparation, ValidOrder]
        const isValid = (rules: ValidRules, r: Report) : boolean => rules.reduce((res, rule) => rule(r) && res, true);
        const validReports = d
            .map(r => isValid(validRules, r))
            .reduce((curr, valid) => curr + (valid ? 1 : 0), 0);
        console.log(validReports);

        const invalidReports = d.filter(r => !isValid(validRules, r));
        const constructDampenedReport = (report: Report): Report[] => {
            // construct the dampened report 
            const newReport = (i: number) => report.filter((_, curr) => curr !== i);
            return report.map((_, i) => newReport(i));
        }
        const validDampenedReports = invalidReports
            .filter(report => constructDampenedReport(report)
                .map(r => isValid(validRules, r))
                .filter(valid => valid)
                .length > 0).length
            
        console.log(validDampenedReports + validReports);

        // for each of the invalid reports we need to 
    });
}