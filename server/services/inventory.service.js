import { mockInventory } from './mock.service.js';
import { getStorageProtocol } from '../prompts/storage.prompt.js';

export const getInventory = () => mockInventory;

export const addInventoryItem = (itemData) => {
    const { name, chamber, qty, unit, daysLeft, boxSize } = itemData;
    const storageProtocol = getStorageProtocol(name);
    
    const newItem = {
        id: "i_" + Date.now(),
        name, chamber, qty, unit, daysLeft, boxSize,
        storageProtocol,
        addedDate: new Date().toISOString().split("T")[0]
    };
    
    mockInventory.push(newItem);
    return newItem;
};
