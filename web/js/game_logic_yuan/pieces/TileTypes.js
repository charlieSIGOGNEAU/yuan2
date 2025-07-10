    export const TILE_CONFIGS = {
    "Am": {
        model: './glb/tiles/Am.glb',
        terrains: ["water","mountain","mine","water","forest","mountain","plain"],
        names: ["","","GE","","ALTAI","","CAO"]
    },
    "Bm": {
        model: './glb/tiles/Bm.glb',
        terrains: ["forest","mountain","mine","water","forest","water","plain"],
        names: ["JU","","LI","","HUO","","MAND"]
    },
    "Cm": {
        model: './glb/tiles/Cm.glb',
        terrains: ["water","mountain","plain","forest","mountain","mine","mountain"],
        names: ["","","QIN","TAN","","WUZ",""]
    },
    "Dm": {
        model: './glb/tiles/Dm.glb',
        terrains: ["plain","water","forest","mine","rice","mountain","water"],
        names: ["CHENG","","ZAV","XU","BAO","",""]
    },
    "Em": {
        model: './glb/tiles/Em.glb',
        terrains: ["water","rice","rice","plain","water","water","mountain"],
        names: ["","IK","HOV","GVI","","",""]
    },
    "Fm": {
        model: './glb/tiles/Fm.glb',
        terrains: ["mountain","mountain","rice","plain","forest","water","mountain"],
        names: ["","","LIANG","KHAL","MAO","","",]
    },
    "Gm": {
        model: './glb/tiles/Gm.glb',
        terrains: ["plain","rice","mine","rice","forest","mountain","mountain"],
        names: ["XIA","TANG","SONG","NIE","ULAN","",""]
    },
    "Hm": {
        model: './glb/tiles/Hm.glb',
        terrains: ["mine","mine","water","water","mountain","rice","water"],
        names: ["BAY","ZHOU","","","","YAN",""]
    },
    "Im": {
        model: './glb/tiles/Im.glb',
        terrains: ["mountain","mountain","mountain","mountain","water","rice","forest"],
        names: ["","","","","","FEI","GU"]
    },
    "Jm": {
        model: './glb/tiles/Jm.glb',
        terrains: ["rice","water","plain","mountain","rice","mine","mountain"],
        names: ["LU","","HUAN","","JIN","LAI",""]
    },
    "Km": {
        model: './glb/tiles/Km.glb',
        terrains: ["plain","water","forest","forest","mountain","mountain","water"],
        names: ["SUH","","OVOR","MI","","",""]
    },
    "Lm": {
        model: './glb/tiles/Lm.glb',
        terrains: ["water","water","mine","plain","mine","water","water"],
        names: ["","","XIANG","WEY","TENG","",""]
    },
    "Mm": {
        model: './glb/tiles/Mm.glb',
        terrains: ["water","water","mountain","mountain","forest","plain","mine"],
        names: ["","","","","YANG","ZONG","BAYAN"]
    },
    "Nm": {
        model: './glb/tiles/Nm.glb',
        terrains: ["plain","forest","plain","rice","mine","water","rice"],
        names: ["ZOU","YI","TOV","MOU","GUZA","","BOGD"]
    },
    "Om": {
        model: './glb/tiles/Om.glb',
        terrains: ["water","water","mine","mountain","mountain","forest","rice"],
        names: ["","","YING","","","BUL","YU"]
    }
}; 
    export function tileInGame(numPlayers) {
        return {
        2: ["Am", "Bm", "Cm", "Dm", "Em", "Fm", "Gm", "Hm"],
        3: ["Am", "Bm", "Cm", "Dm", "Em", "Fm", "Gm", "Hm", "Im", "Jm", "Km", "Lm"],
        4: ["Am", "Bm", "Cm", "Dm", "Em", "Fm", "Gm", "Hm", "Im", "Jm", "Km", "Lm", "Mm", "Nm", "Om"]
        }[numPlayers];
    }
    


