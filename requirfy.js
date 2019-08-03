const
	fs = require('fs'),
	fsp = fs.promises,
	path = require('path');

const dir = process.argv[2] || __dirname;

(function recurseDirs(dir) {
	for (let file of fs.readdirSync(dir, {withFileTypes: true})) {
		if (file.isDirectory()) {
			recurseDirs(path.join(dir, file.name))
		} else if (/\.js$/.test(file.name)){
			fsp.readFile(path.join(dir, file.name), 'utf8')
				.then(code => {
					let
						exportDefault = code.match(/export\s+default\s+(?<module>[^;\s]+)/),
						rewrite = false;

					if (exportDefault) {
						code = code.replace(exportDefault[0], 'module.exports = ' + exportDefault.groups.module);
						rewrite = true;
					}

					let subRe = 'export .+?[;\\n]'
					//let namedExports = code.match(/(?<=[;\}]\s*)(export .+?[;\n])|^export .+?[;\n]/g);
					let namedExports = code.match(RegExp(`(?<=[;\\}]\\s*)(${subRe})|^${subRe}`, 'g'))
					if (namedExports) {
						for (let nExp of namedExports) {
							code = code.replace(nExp, '');
						}

						rewrite = true;
					}

					for (let import_ of code.matchAll(/import\s+(?<name>[\S]+)\s+from\s+['"](?<path>.+?)['"]/g)) {
						if (import_) {
							let {name, path} = import_.groups;
							code = code.replace(import_[0], `const ${name} = require('${path}')`);
							rewrite = true;
						}
					}

					if (rewrite) {
						console.log(file.name);
						fsp.writeFile(path.join(dir, file.name), code);
					}
				});
		}
	}
})(dir);
