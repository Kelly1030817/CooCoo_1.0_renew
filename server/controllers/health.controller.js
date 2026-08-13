export const healthCheck = (req, res) => {
    res.json({ success: true, message: 'CooCoo Backend is running smoothly.' });
};
