// Mode: Run Once for All Items
async function toDataUrl(name) {
  try {
    // Holt den Buffer aus items[0].binary[name]
    const buf = await this.helpers.getBinaryDataBuffer(0, name);
    const mime = (items[0].binary?.[name]?.mimeType) || 'image/png';
    return `data:${mime};base64,${buf.toString('base64')}`;
  } catch {
    return null; // falls das Property fehlt
  }
}

return [{
  json: {
    assets: {
      ryzeup: await toDataUrl('ryzeup'),
      bg:     await toDataUrl('bg'),
      fa:     await toDataUrl('fa'),
    }
  }
}];
