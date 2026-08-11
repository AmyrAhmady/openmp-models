import { readFile } from 'node:fs/promises';

const catalogs = {
    object: {
        file: '../data/source/catalogs/objects.json',
        required: {
            id: 'number',
            name: 'string',
            col: 'boolean',
            breakable: 'boolean',
            visibility: 'string',
            anime: 'boolean',
            radius: 'number',
            txd: 'string',
        },
        validate(item) {
            return (
                Array.isArray(item.borderbox) &&
                item.borderbox.length === 3 &&
                item.borderbox.every((value) => typeof value === 'number' && Number.isFinite(value))
            );
        },
    },
    skin: {
        file: '../data/source/catalogs/skins.json',
        required: {
            id: 'number',
            model: 'string',
            name: 'string',
            location: 'string',
            gender: 'string',
        },
    },
    vehicle: {
        file: '../data/source/catalogs/vehicles.json',
        required: {
            id: 'number',
            model: 'string',
            name: 'string',
            cat: 'string',
            mods: 'string',
        },
    },
};

function parseCatalog(source, type) {
    try {
        return JSON.parse(source);
    } catch (error) {
        throw new Error(`Catalog "${type}" is not valid JSON: ${error.message}`);
    }
}

function validateCatalog(type, definition, records) {
    if (!Array.isArray(records) || records.length === 0) {
        throw new Error(`Catalog "${type}" must be a non-empty array`);
    }

    const ids = new Set();
    records.forEach((item, index) => {
        if (!item || typeof item !== 'object') {
            throw new Error(`Catalog "${type}" record ${index} must be an object`);
        }

        Object.entries(definition.required).forEach(([key, expectedType]) => {
            if (typeof item[key] !== expectedType) {
                throw new Error(`Catalog "${type}" record ${index} has an invalid ${key}`);
            }
        });

        if (!Number.isInteger(item.id) || ids.has(item.id)) {
            throw new Error(`Catalog "${type}" record ${index} has a duplicate or invalid id`);
        }
        ids.add(item.id);

        if (definition.validate && !definition.validate(item)) {
            throw new Error(`Catalog "${type}" record ${index} failed its shape validation`);
        }
    });

    return records.length;
}

for (const [type, definition] of Object.entries(catalogs)) {
    const source = await readFile(new URL(definition.file, import.meta.url), 'utf8');
    const count = validateCatalog(type, definition, parseCatalog(source, type));
    console.log(`${type}: ${count} valid records`);
}
