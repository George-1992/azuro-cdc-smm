import { handleApiRequest } from "@/components/serverActions.jsx/apiHandler";

export async function GET(req, res) {
    return await handleApiRequest(req, res);
}
export async function POST(req, res) {
    return await handleApiRequest(req, res);
}