// Définition des clans et leurs couleurs
class ClanColor {
    constructor(name, color_hex, color_name) {
        this.name = name;
        this.color_hex = color_hex;
        this.color_name = color_name;
    }
}

// Tableau des codes couleurs hexadécimaux
const COLOR_CODES = {
    black: '#000000',
    red: '#FF0000',
    green: '#008000',
    orange: '#FFA500',
    white: '#FFFFFF',
    blue: '#0000FF',
    purple: '#800080',
    yellow: '#FFFF00',
    // pink: '#FFC0CB',
    // cyan: '#00FFFF',
    // lime: '#00FF00',
    // brown: '#A52A2A',
    // gray: '#808080',
    // navy: '#000080',
    // maroon: '#800000',
    // teal: '#008080'
};

// Les 8 clans ASYMMETRIC
const Mu = new ClanColor('Mu', COLOR_CODES.black, 'black');
const Suhey = new ClanColor('Suhey', COLOR_CODES.red, 'red');
const Weyu = new ClanColor('Weyu', COLOR_CODES.green, 'green');
const Xiang = new ClanColor('Xiang', COLOR_CODES.orange, 'orange');
const Huan = new ClanColor('Huan', COLOR_CODES.white, 'white');
const Zhuang = new ClanColor('Zhuang', COLOR_CODES.blue, 'blue');
const Luong = new ClanColor('Luong', COLOR_CODES.purple, 'purple');
const Goujian = new ClanColor('Goujian', COLOR_CODES.yellow, 'yellow');

// Les 8 clans BASIC (nommés par leur couleur)
const clan_black = new ClanColor('Black', COLOR_CODES.black, 'black');
const clan_red = new ClanColor('Red', COLOR_CODES.red, 'red');
const clan_green = new ClanColor('Green', COLOR_CODES.green, 'green');
const clan_orange = new ClanColor('Orange', COLOR_CODES.orange, 'orange');
const clan_white = new ClanColor('White', COLOR_CODES.white, 'white');
const clan_blue = new ClanColor('Blue', COLOR_CODES.blue, 'blue');
const clan_purple = new ClanColor('Purple', COLOR_CODES.purple, 'purple');
const clan_yellow = new ClanColor('Yellow', COLOR_CODES.yellow, 'yellow');

// Tableau des clans ASYMMETRIC
export const ASYMMETRIC_CLANS = [
    Mu,
    Suhey,
    Weyu,
    Xiang,
    Huan,
    Zhuang,
    Luong,
    Goujian
];

// Tableau des clans BASIC
export const BASIC_CLANS = [
    clan_black,
    clan_red,
    clan_green,
    clan_orange,
    clan_white,
    clan_blue,
    clan_purple,
    clan_yellow
];

// Export des classes et objets
// export {
//     ClanColor,
//     COLOR_CODES,
//     Mu,
//     Suhey,
//     Weyu,
//     Xiang,
//     Huan,
//     Zhuang,
//     Luong,
//     Goujian,
//     clan_black,
//     clan_red,
//     clan_green,
//     clan_orange,
//     clan_white,
//     clan_blue,
//     clan_purple,
//     clan_yellow
// };

