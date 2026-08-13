import * as inventoryRepo from '../repositories/inventory.repository.js';
import { getStorageProtocol } from '../prompts/storage.prompt.js';

export const getAllInventory = async () => {
    return await inventoryRepo.getAll();
};

export const addInventoryItem = async (itemData) => {
    const { name, chamber, qty, unit, daysLeft, boxSize } = itemData;
    const storageProtocol = getStorageProtocol(name);
    
    const newItem = {
        id: "i_" + Date.now(),
        name, chamber, qty, unit, daysLeft, boxSize,
        storageProtocol,
        addedDate: new Date().toISOString().split("T")[0]
    };
    
    return await inventoryRepo.add(newItem);
};
