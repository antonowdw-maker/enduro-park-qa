import { Request, Response } from 'express';

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  if (username === 'admin' && password === 'admin123') {
    res.json({ success: true, user: { username: 'admin', role: 'admin' } });
  } else {
    res.status(401).json({ success: false, message: 'Неверные учетные данные' });
  }
};