export class ActionLog {
    public id?: number;
    public level?: number;
    public timestamp: string;
    
    public details?: string;
    public rationale?: string;

    public translationKey?: string;
    public translationArgs?: any;
}