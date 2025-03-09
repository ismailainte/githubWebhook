import { handleWebhook } from '../controllers/webhookController';

export default async function (req, res) {
    if (req.method === 'POST') {
        await handleWebhook(req, res);
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
}
