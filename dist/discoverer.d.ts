export interface DiscoveryResult {
    url: string;
    title: string;
    snippet: string;
}
export declare class Discoverer {
    private readonly fetcher;
    constructor();
    discover(topic: string, maxResults?: number): Promise<DiscoveryResult[]>;
    private searchDuckDuckGo;
}
//# sourceMappingURL=discoverer.d.ts.map