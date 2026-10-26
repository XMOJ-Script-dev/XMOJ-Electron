import type { SoftwareEntry } from './types.ts';
export const SOFTWARE: SoftwareEntry[] = [
    ['Bloodshed Dev-C++', 'https://sourceforge.net/projects/dev-cpp/', 'https://a.fsdn.com/allura/p/dev-cpp/icon'],
    ['DevC++ 5.11 TDM-GCC 4.9.2', 'https://www.xmoj.tech/downloads/Dev-Cpp+5.11+TDM-GCC+4.9.2+Setup.exe', 'https://www.xmoj.tech/image/devcpp.png'],
    ['Orwell Dev-C++', 'https://sourceforge.net/projects/orwelldevcpp/', 'https://a.fsdn.com/allura/p/orwelldevcpp/icon'],
    ['Embarcadero Dev-C++', 'https://sourceforge.net/software/product/Embarcadero-Dev-Cpp/', 'https://a.fsdn.com/allura/s/embarcadero-dev-cpp/icon'],
    ['RedPanda C++', 'https://sourceforge.net/projects/redpanda-cpp/', 'https://a.fsdn.com/allura/p/redpanda-cpp/icon'],
    ['CP Editor', 'https://cpeditor.org/zh/download/', 'https://a.fsdn.com/allura/mirror/cp-editor/icon'],
    ['CLion', 'https://www.jetbrains.com/clion/download', 'https://resources.jetbrains.com/storage/products/company/brand/logos/CLion_icon.png'],
    ['CP Editor (SourceForge)', 'https://sourceforge.net/projects/cp-editor.mirror/', 'https://a.fsdn.com/allura/mirror/cp-editor/icon'],
    ['Code::Blocks', 'https://sourceforge.net/projects/codeblocks/', 'https://a.fsdn.com/allura/p/codeblocks/icon'],
    ['Visual Studio Code', 'https://code.visualstudio.com/Download', 'https://code.visualstudio.com/favicon.ico'],
    ['Lazarus', 'https://sourceforge.net/projects/lazarus/', 'https://a.fsdn.com/allura/p/lazarus/icon'],
    ['Geany', 'https://www.geany.org/download/releases/', 'https://www.geany.org/static/img/geany.svg'],
    ['NOI Linux', 'https://www.noi.cn/gynoi/jsgz/2021-07-16/732450.shtml', 'https://www.noi.cn/upload/resources/image/2021/07/16/163780.jpg'],
    ['VirtualBox', 'https://www.virtualbox.org/wiki/Downloads', 'https://www.virtualbox.org/graphics/vbox_logo2_gradient.png'],
    ['MinGW', 'https://sourceforge.net/projects/mingw/', 'https://www.mingw-w64.org/logo.svg'],
].map(([name, url, image]) => ({ name, url, image }));
