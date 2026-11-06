async function testBytes(path, fileData)
{
    const getImageBuffers = [];

    for(const image of fileData)
    {
		if(image.compressed || image.folder)
			continue;

        const path = image.path;
        const ext = app.extname(path);

		const compressed = fileManager.lastCompressedFile(path);

		const data = {
			sha: image.sha,
			ext,
			path,
			compressed: compressed,
			name: p.basename(path),
			size: 64,
		};

        getImageBuffers.push(data);
    }

    const buffers = await fileManager.compressedStreamReader.getBuffers(getImageBuffers);
}

async function testExtraction(path, fileData)
{
    const files = fileData
        .filter(image => !image.compressed && !image.folder)
        .map(({path}) => ({path}));

    const file = fileManager.file(path, {
        cache: false,
        log: false,
        progress: false,
    });

    try
    {
        await file.makeAvailable(files, false, true);
    }
    finally
    {
        file.destroy();
    }
}

async function benchmark(files = [], iterations = 10) 
{
    const fileList = {};

    for(const file of files)
    {
        const _file = fileManager.file(file);
        fileList[file] = await _file.readRecursive({sha: true});
    }

    console.log('Starting benchmark...');

    const tests = [
        {
            name: 'testBytes',
            callback: testBytes
        },
        {
            name: 'testExtraction',
            callback: testExtraction
        }
    ];

    const testData = {};

    for(const test of tests)
    {
        for(const file of files)
        {
            const iterationTimes = [];

            for(let i = 0; i < iterations; i++)
            {
                settings.removeTemporaryFiles(true);

                const iterationStartTime = performance.now();

                await test.callback(file, fileList[file]);

                iterationTimes.push(performance.now() - iterationStartTime);
            }

            const totalTime = iterationTimes.reduce((a, b) => a + b, 0);

            console.log(`Total time for test ${test.name} and file ${file} took ${totalTime} ms`);
            console.log(`Iteration times for test ${test.name} and file ${file}:`, iterationTimes);

            testData[test.name] = testData[test.name] || {};
            testData[test.name][file] = {
                totalTime,
                iterationTimes,
                averageTime: iterationTimes.reduce((a, b) => a + b, 0) / iterationTimes.length,
            }
        }
    }

    // Print results
    for(const [testName, results] of Object.entries(testData))
    {
        const rows = Object.entries(results).map(([file, data]) => ({
            file: p.basename(file),
            total: `${data.totalTime.toFixed(2)} ms`,
            average: `${data.averageTime.toFixed(2)} ms`,
            min: `${Math.min(...data.iterationTimes).toFixed(2)} ms`,
            max: `${Math.max(...data.iterationTimes).toFixed(2)} ms`,
        }));

        const columns = [
            {key: 'file', title: 'File'},
            {key: 'total', title: 'Total'},
            {key: 'average', title: 'Average'},
            {key: 'min', title: 'Min'},
            {key: 'max', title: 'Max'},
        ];

        const widths = columns.map(column =>
            Math.max(column.title.length, ...rows.map(row => row[column.key].length))
        );

        const separator = `+${widths.map(width => '-'.repeat(width + 2)).join('+')}+`;
        const formatRow = values =>
            `| ${values.map((value, index) => value.padEnd(widths[index])).join(' | ')} |`;

        console.log(`\n${testName}`);
        console.log(separator);
        console.log(formatRow(columns.map(column => column.title)));
        console.log(separator);

        for(const row of rows)
            console.log(formatRow(columns.map(column => row[column.key])));

        console.log(separator);
    }
}

/*
const benchmark = require(p.join(appDir, '.dist/benchmark.js'));
benchmark();
*/

module.exports = benchmark;