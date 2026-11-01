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

const catalogIds = {};

for (const [type, definition] of Object.entries(catalogs)) {
    const source = await readFile(new URL(definition.file, import.meta.url), 'utf8');
    const records = parseCatalog(source, type);
    const count = validateCatalog(type, definition, records);
    catalogIds[type] = new Set(records.map((item) => item.id));
    console.log(`${type}: ${count} valid records`);
}

function validateTextures(dictionaries) {
    if (!Array.isArray(dictionaries) || dictionaries.length === 0) {
        throw new Error('Catalog "texture" must be a non-empty array');
    }

    const usageKeys = { objects: 'object', skins: 'skin', vehicles: 'vehicle' };
    const names = new Set();
    let count = 0;
    dictionaries.forEach((dictionary, index) => {
        if (
            !dictionary ||
            typeof dictionary.name !== 'string' ||
            !dictionary.name ||
            !Array.isArray(dictionary.textures)
        ) {
            throw new Error(`Catalog "texture" dictionary ${index} has an invalid shape`);
        }
        if (names.has(dictionary.name)) {
            throw new Error(`Catalog "texture" dictionary ${dictionary.name} is duplicated`);
        }
        names.add(dictionary.name);

        dictionary.textures.forEach((texture, textureIndex) => {
            const valid =
                texture &&
                typeof texture.name === 'string' &&
                texture.name.length > 0 &&
                Number.isInteger(texture.width) &&
                Number.isInteger(texture.height) &&
                typeof texture.format === 'string' &&
                texture.format.length > 0;
            if (!valid) {
                throw new Error(
                    `Catalog "texture" ${dictionary.name} record ${textureIndex} has an invalid shape`
                );
            }

            Object.entries(usageKeys).forEach(([key, type]) => {
                if (
                    !Array.isArray(texture[key]) ||
                    !texture[key].every((id) => catalogIds[type].has(id))
                ) {
                    throw new Error(
                        `Catalog "texture" ${dictionary.name}/${texture.name} has an unknown ${type} id`
                    );
                }
            });
            count += 1;
        });
    });

    return count;
}

const textureSource = await readFile(
    new URL('../data/source/catalogs/textures.json', import.meta.url),
    'utf8'
);
console.log(`texture: ${validateTextures(parseCatalog(textureSource, 'texture'))} valid records`);
