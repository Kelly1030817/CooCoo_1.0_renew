import { mockInventory } from '../services/mock.service.js';

export const getAll = async () => {
    // In the future, check if Supabase is connected, else fallback to mockInventory
    return mockInventory;
};

export const add = async (item) => {
    mockInventory.push(item);
    return item;
};

export const findById = async (id) => {
    return mockInventory.find(item => item.id === id);
};
