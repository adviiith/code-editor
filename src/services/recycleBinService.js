// Get items from recycle bin
export const getRecycleBinItems = () => {
    const recycleBin = localStorage.getItem("recycleBin");
    return recycleBin ? JSON.parse(recycleBin) : [];
  };
  
  // Add item to recycle bin
  export const addToRecycleBin = (item) => {
    const recycleBin = getRecycleBinItems();
    
    // Add deletion date and 30-day expiration
    const deletedItem = {
      ...item,
      deletedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    };
    
    recycleBin.push(deletedItem);
    localStorage.setItem("recycleBin", JSON.stringify(recycleBin));
  };
  
  // Remove item from recycle bin
  export const removeFromRecycleBin = (id, type) => {
    const recycleBin = getRecycleBinItems();
    const updatedRecycleBin = recycleBin.filter(item => !(item.id === id && item.type === type));
    localStorage.setItem("recycleBin", JSON.stringify(updatedRecycleBin));
  };
  
  // Restore item from recycle bin
  export const restoreFromRecycleBin = (id, type) => {
    const recycleBin = getRecycleBinItems();
    const itemToRestore = recycleBin.find(item => item.id === id && item.type === type);
    
    if (!itemToRestore) {
      throw new Error("Item not found in recycle bin");
    }
    
    // Remove from recycle bin
    removeFromRecycleBin(id, type);
    
    // Return the item without the recycle bin metadata
    const { deletedAt, expiresAt, ...restoredItem } = itemToRestore;
    return restoredItem;
  };
  
  // Clean expired items (items older than 30 days)
  export const cleanExpiredItems = () => {
    const recycleBin = getRecycleBinItems();
    const now = new Date().toISOString();
    
    const updatedRecycleBin = recycleBin.filter(item => item.expiresAt > now);
    
    if (updatedRecycleBin.length !== recycleBin.length) {
      localStorage.setItem("recycleBin", JSON.stringify(updatedRecycleBin));
      return recycleBin.length - updatedRecycleBin.length; // Return number of items removed
    }
    
    return 0;
  };
  
  // Empty recycle bin (delete all items)
  export const emptyRecycleBin = () => {
    localStorage.setItem("recycleBin", JSON.stringify([]));
  };