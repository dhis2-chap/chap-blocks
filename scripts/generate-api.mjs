import { readFile } from 'node:fs/promises';
import { generate } from 'openapi-typescript-codegen';

// Refresh openapi.json from a trusted Chap server before running this script.
const schema = JSON.parse(
    await readFile(
        new URL('../packages/api/openapi.json', import.meta.url),
        'utf8',
    ),
);
// FastAPI 3.1 uses contentMediaType for files; this generator expects format: binary.
for (const model of Object.values(schema.components.schemas)) {
    for (const property of Object.values(model.properties ?? {})) {
        if (property.contentMediaType === 'application/octet-stream')
            property.format = 'binary';
    }
}
await generate({
    input: schema,
    output: 'packages/api/src/generated',
    clientName: 'GeneratedChapClient',
    httpClient: 'fetch',
});
