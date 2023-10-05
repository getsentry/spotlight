export interface Integration {
    name: string;
    version: string;
    hooks: {
        [name: string]: (payload: any) => void;
    };
}