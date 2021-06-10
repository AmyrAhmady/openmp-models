import * as _ from "lodash";
import * as THREE from "three";

export default class Service {
    static instance: Service;

    vehicleNames = {
        "400": "Landstalker",
        "401": "Bravura",
        "402": "Buffalo",
        "403": "Linerunner",
        "404": "Perennial",
        "405": "Sentinel",
        "406": "Dumper",
        "407": "Firetruck",
        "408": "Trashmaster",
        "409": "Stretch",
        "410": "Manana",
        "411": "Infernus",
        "412": "Voodoo",
        "413": "Pony",
        "414": "Mule",
        "415": "Cheetah",
        "416": "Ambulance",
        "417": "Leviathan",
        "418": "Moonbeam",
        "419": "Esperanto",
        "420": "Taxi",
        "421": "Washington",
        "422": "Bobcat",
        "423": "Mr. Whoopee",
        "424": "BF Injection",
        "425": "Hunter",
        "426": "Premier",
        "427": "Enforcer",
        "428": "Securicar",
        "429": "Banshee",
        "430": "Predator",
        "431": "Bus",
        "432": "Rhino",
        "433": "Barracks",
        "434": "Hotknife",
        "435": "Article Trailer",
        "436": "Previon",
        "437": "Coach",
        "438": "Cabbie",
        "439": "Stallion",
        "440": "Rumpo",
        "441": "RC Bandit",
        "442": "Romero",
        "443": "Packer",
        "444": "Monster",
        "445": "Admiral",
        "446": "Squallo",
        "447": "Seasparrow",
        "448": "Pizzaboy",
        "449": "Tram",
        "450": "Article Trailer 2",
        "451": "Turismo",
        "452": "Speeder",
        "453": "Reefer",
        "454": "Tropic",
        "455": "Flatbed",
        "456": "Yankee",
        "457": "Caddy",
        "458": "Solair",
        "459": "Topfun Van (Berkley's RC)",
        "460": "Skimmer",
        "461": "PCJ-600",
        "462": "Faggio",
        "463": "Freeway",
        "464": "RC Baron",
        "465": "RC Raider",
        "466": "Glendale",
        "467": "Oceanic",
        "468": "Sanchez",
        "469": "Sparrow",
        "470": "Patriot",
        "471": "Quad",
        "472": "Coastguard",
        "473": "Dinghy",
        "474": "Hermes",
        "475": "Sabre",
        "476": "Rustler",
        "477": "ZR-350",
        "478": "Walton",
        "479": "Regina",
        "480": "Comet",
        "481": "BMX",
        "482": "Burrito",
        "483": "Camper",
        "484": "Marquis",
        "485": "Baggage",
        "486": "Dozer",
        "487": "Maverick",
        "488": "SAN News Maverick",
        "489": "Rancher",
        "490": "FBI Rancher",
        "491": "Virgo",
        "492": "Greenwood",
        "493": "Jetmax",
        "494": "Hotring Racer",
        "495": "Sandking",
        "496": "Blista Compact",
        "497": "Police Maverick",
        "498": "Boxville",
        "499": "Benson",
        "500": "Mesa",
        "501": "RC Goblin",
        "502": "Hotring Racer A",
        "503": "Hotring Racer B",
        "504": "Bloodring Banger",
        "505": "Rancher Lure",
        "506": "Super GT",
        "507": "Elegant",
        "508": "Journey",
        "509": "Bike",
        "510": "Mountain Bike",
        "511": "Beagle",
        "512": "Cropduster",
        "513": "Stuntplane",
        "514": "Tanker",
        "515": "Roadtrain",
        "516": "Nebula",
        "517": "Majestic",
        "518": "Buccaneer",
        "519": "Shamal",
        "520": "Hydra",
        "521": "FCR-900",
        "522": "NRG-500",
        "523": "HPV1000",
        "524": "Cement Truck",
        "525": "Towtruck",
        "526": "Fortune",
        "527": "Cadrona",
        "528": "FBI Truck",
        "529": "Willard",
        "530": "Forklift",
        "531": "Tractor",
        "532": "Combine Harvester",
        "533": "Feltzer",
        "534": "Remington",
        "535": "Slamvan",
        "536": "Blade",
        "537": "Freight (Train)",
        "538": "Brownstreak (Train)",
        "539": "Vortex",
        "540": "Vincent",
        "541": "Bullet",
        "542": "Clover",
        "543": "Sadler",
        "544": "Firetruck LA",
        "545": "Hustler",
        "546": "Intruder",
        "547": "Primo",
        "548": "Cargobob",
        "549": "Tampa",
        "550": "Sunrise",
        "551": "Merit",
        "552": "Utility Van",
        "553": "Nevada",
        "554": "Yosemite",
        "555": "Windsor",
        "556": "Monster 'A'",
        "557": "Monster 'B'",
        "558": "Uranus",
        "559": "Jester",
        "560": "Sultan",
        "561": "Stratum",
        "562": "Elegy",
        "563": "Raindance",
        "564": "RC Tiger",
        "565": "Flash",
        "566": "Tahoma",
        "567": "Savanna",
        "568": "Bandito",
        "569": "Freight Flat Trailer (Train)",
        "570": "Streak Trailer (Train)",
        "571": "Kart",
        "572": "Mower",
        "573": "Dune",
        "574": "Sweeper",
        "575": "Broadway",
        "576": "Tornado",
        "577": "AT400",
        "578": "DFT-30",
        "579": "Huntley",
        "580": "Stafford",
        "581": "BF-400",
        "582": "Newsvan",
        "583": "Tug",
        "584": "Petrol Trailer",
        "585": "Emperor",
        "586": "Wayfarer",
        "587": "Euros",
        "588": "Hotdog",
        "589": "Club",
        "590": "Freight Box Trailer (Train)",
        "591": "Article Trailer 3",
        "592": "Andromada",
        "593": "Dodo",
        "594": "RC Cam",
        "595": "Launch",
        "596": "Police Car (LSPD)",
        "597": "Police Car (SFPD)",
        "598": "Police Car (LVPD)",
        "599": "Police Ranger",
        "600": "Picador",
        "601": "S.W.A.T.",
        "602": "Alpha",
        "603": "Phoenix",
        "604": "Glendale Shit",
        "605": "Sadler Shit",
        "606": "Baggage Trailer 'A'",
        "607": "Baggage Trailer 'B'",
        "608": "Tug Stairs Trailer",
        "609": "Boxville",
        "610": "Farm Trailer",
        "611": "Utility Trailer",
    };

    vehicleModelNames = {
        "400": "landstal",
        "401": "bravura",
        "402": "buffalo",
        "403": "linerun",
        "404": "peren",
        "405": "sentinel",
        "406": "dumper",
        "407": "firetruk",
        "408": "trash",
        "409": "stretch",
        "410": "manana",
        "411": "infernus",
        "412": "voodoo",
        "413": "pony",
        "414": "mule",
        "415": "cheetah",
        "416": "ambulan",
        "417": "leviathn",
        "418": "moonbeam",
        "419": "esperant",
        "420": "taxi",
        "421": "washing",
        "422": "bobcat",
        "423": "mrwhoop",
        "424": "bfinject",
        "425": "hunter",
        "426": "premier",
        "427": "enforcer",
        "428": "securica",
        "429": "banshee",
        "430": "predator",
        "431": "bus",
        "432": "rhino",
        "433": "barracks",
        "434": "hotknife",
        "435": "artict1",
        "436": "previon",
        "437": "coach",
        "438": "cabbie",
        "439": "stallion",
        "440": "rumpo",
        "441": "rcbandit",
        "442": "romero",
        "443": "packer",
        "444": "monster",
        "445": "admiral",
        "446": "squalo",
        "447": "seaspar",
        "448": "pizzaboy",
        "449": "tram",
        "450": "artict2",
        "451": "turismo",
        "452": "speeder",
        "453": "reefer",
        "454": "tropic",
        "455": "flatbed",
        "456": "yankee",
        "457": "caddy",
        "458": "solair",
        "459": "topfun",
        "460": "skimmer",
        "461": "pcj600",
        "462": "faggio",
        "463": "freeway",
        "464": "rcbaron",
        "465": "rcraider",
        "466": "glendale",
        "467": "oceanic",
        "468": "sanchez",
        "469": "sparrow",
        "470": "patriot",
        "471": "quad",
        "472": "coastg",
        "473": "dinghy",
        "474": "hermes",
        "475": "sabre",
        "476": "rustler",
        "477": "zr350",
        "478": "walton",
        "479": "regina",
        "480": "comet",
        "481": "bmx",
        "482": "burrito",
        "483": "camper",
        "484": "marquis",
        "485": "baggage",
        "486": "dozer",
        "487": "maverick",
        "488": "vcnmav",
        "489": "rancher",
        "490": "fbiranch",
        "491": "virgo",
        "492": "greenwoo",
        "493": "jetmax",
        "494": "hotring",
        "495": "sandking",
        "496": "blistac",
        "497": "polmav",
        "498": "boxville",
        "499": "benson",
        "500": "mesa",
        "501": "rcgoblin",
        "502": "hotrina",
        "503": "hotrinb",
        "504": "bloodra",
        "505": "rnchlure",
        "506": "supergt",
        "507": "elegant",
        "508": "journey",
        "509": "bike",
        "510": "mtbike",
        "511": "beagle",
        "512": "cropdust",
        "513": "stunt",
        "514": "petro",
        "515": "rdtrain",
        "516": "nebula",
        "517": "majestic",
        "518": "buccanee",
        "519": "shamal",
        "520": "hydra",
        "521": "fcr900",
        "522": "nrg500",
        "523": "copbike",
        "524": "cement",
        "525": "towtruck",
        "526": "fortune",
        "527": "cadrona",
        "528": "fbitruck",
        "529": "willard",
        "530": "forklift",
        "531": "tractor",
        "532": "combine",
        "533": "feltzer",
        "534": "remingtn",
        "535": "slamvan",
        "536": "blade",
        "537": "freight",
        "538": "streak",
        "539": "vortex",
        "540": "vincent",
        "541": "bullet",
        "542": "clover",
        "543": "sadler",
        "544": "firela",
        "545": "hustler",
        "546": "intruder",
        "547": "primo",
        "548": "cargobob",
        "549": "tampa",
        "550": "sunrise",
        "551": "merit",
        "552": "utility",
        "553": "nevada",
        "554": "yosemite",
        "555": "windsor",
        "556": "monstera",
        "557": "monsterb",
        "558": "uranus",
        "559": "jester",
        "560": "sultan",
        "561": "stratum",
        "562": "elegy",
        "563": "raindanc",
        "564": "rctiger",
        "565": "flash",
        "566": "tahoma",
        "567": "savanna",
        "568": "bandito",
        "569": "freiflat",
        "570": "streakc",
        "571": "kart",
        "572": "mower",
        "573": "duneride",
        "574": "sweeper",
        "575": "broadway",
        "576": "tornado",
        "577": "at400",
        "578": "dft30",
        "579": "huntley",
        "580": "stafford",
        "581": "bf400",
        "582": "newsvan",
        "583": "tug",
        "584": "petrotr",
        "585": "emperor",
        "586": "wayfarer",
        "587": "euros",
        "588": "hotdog",
        "589": "club",
        "590": "freibox",
        "591": "artict3",
        "592": "androm",
        "593": "dodo",
        "594": "rccam",
        "595": "launch",
        "596": "copcarla",
        "597": "copcarsf",
        "598": "copcarvg",
        "599": "copcarru",
        "600": "picador",
        "601": "swatvan",
        "602": "alpha",
        "603": "phoenix",
        "604": "glenshit",
        "605": "sadlshit",
        "606": "bagboxa",
        "607": "bagboxb",
        "608": "tugstair",
        "609": "boxburg",
        "610": "farmtr1",
        "611": "utiltr1",
    };

    vehicleColors: number[] = [
        0x040404ff,
        0xf5f5f5ff,
        0x2a77a1ff,
        0x840410ff,
        0x263739ff,
        0x86446eff,
        0xd78e10ff,
        0x4c75b7ff,
        0xbdbec6ff,
        0x5e7072ff,
        0x46597aff,
        0x656a79ff,
        0x5d7e8dff,
        0x58595aff,
        0xd6dad6ff,
        0x9ca1a3ff,
        0x335f3fff,
        0x730e1aff,
        0x7b0a2aff,
        0x9f9d94ff,
        0x3b4e78ff,
        0x732e3eff,
        0x691e3bff,
        0x96918cff,
        0x515459ff,
        0x3f3e45ff,
        0xa5a9a7ff,
        0x635c5aff,
        0x3d4a68ff,
        0x979592ff,
        0x421f21ff,
        0x5f272bff,
        0x8494abff,
        0x767b7cff,
        0x646464ff,
        0x5a5752ff,
        0x252527ff,
        0x2d3a35ff,
        0x93a396ff,
        0x6d7a88ff,
        0x221918ff,
        0x6f675fff,
        0x7c1c2aff,
        0x5f0a15ff,
        0x193826ff,
        0x5d1b20ff,
        0x9d9872ff,
        0x7a7560ff,
        0x989586ff,
        0xadb0b0ff,
        0x848988ff,
        0x304f45ff,
        0x4d6268ff,
        0x162248ff,
        0x272f4bff,
        0x7d6256ff,
        0x9ea4abff,
        0x9c8d71ff,
        0x6d1822ff,
        0x4e6881ff,
        0x9c9c98ff,
        0x917347ff,
        0x661c26ff,
        0x949d9fff,
        0xa4a7a5ff,
        0x8e8c46ff,
        0x341a1eff,
        0x6a7a8cff,
        0xaaad8eff,
        0xab988fff,
        0x851f2eff,
        0x6f8297ff,
        0x585853ff,
        0x9aa790ff,
        0x601a23ff,
        0x20202cff,
        0xa4a096ff,
        0xaa9d84ff,
        0x78222bff,
        0x0e316dff,
        0x722a3fff,
        0x7b715eff,
        0x741d28ff,
        0x1e2e32ff,
        0x4d322fff,
        0x7c1b44ff,
        0x2e5b20ff,
        0x395a83ff,
        0x6d2837ff,
        0xa7a28fff,
        0xafb1b1ff,
        0x364155ff,
        0x6d6c6eff,
        0x0f6a89ff,
        0x204b6bff,
        0x2b3e57ff,
        0x9b9f9dff,
        0x6c8495ff,
        0x4d8495ff,
        0xae9b7fff,
        0x406c8fff,
        0x1f253bff,
        0xab9276ff,
        0x134573ff,
        0x96816cff,
        0x64686aff,
        0x105082ff,
        0xa19983ff,
        0x385694ff,
        0x525661ff,
        0x7f6956ff,
        0x8c929aff,
        0x596e87ff,
        0x473532ff,
        0x44624fff,
        0x730a27ff,
        0x223457ff,
        0x640d1bff,
        0xa3adc6ff,
        0x695853ff,
        0x9b8b80ff,
        0x620b1cff,
        0x5b5d5eff,
        0x624428ff,
        0x731827ff,
        0x1b376dff,
        0xec6aaeff,
        0x000000ff,
        0x177517ff,
        0x210606ff,
        0x125478ff,
        0x452a0dff,
        0x571e1eff,
        0x010701ff,
        0x25225aff,
        0x2c89aaff,
        0x8a4dbdff,
        0x35963aff,
        0xb7b7b7ff,
        0x464c8dff,
        0x84888cff,
        0x817867ff,
        0x817a26ff,
        0x6a506fff,
        0x583e6fff,
        0x8cb972ff,
        0x824f78ff,
        0x6d276aff,
        0x1e1d13ff,
        0x1e1306ff,
        0x1f2518ff,
        0x2c4531ff,
        0x1e4c99ff,
        0x2e5f43ff,
        0x1e9948ff,
        0x1e9999ff,
        0x999976ff,
        0x7c8499ff,
        0x992e1eff,
        0x2c1e08ff,
        0x142407ff,
        0x993e4dff,
        0x1e4c99ff,
        0x198181ff,
        0x1a292aff,
        0x16616fff,
        0x1b6687ff,
        0x6c3f99ff,
        0x481a0eff,
        0x7a7399ff,
        0x746d99ff,
        0x53387eff,
        0x222407ff,
        0x3e190cff,
        0x46210eff,
        0x991e1eff,
        0x8d4c8dff,
        0x805b80ff,
        0x7b3e7eff,
        0x3c1737ff,
        0x733517ff,
        0x781818ff,
        0x83341aff,
        0x8e2f1cff,
        0x7e3e53ff,
        0x7c6d7cff,
        0x020c02ff,
        0x072407ff,
        0x163012ff,
        0x16301bff,
        0x642b4fff,
        0x368452ff,
        0x999590ff,
        0x818d96ff,
        0x99991eff,
        0x7f994cff,
        0x839292ff,
        0x788222ff,
        0x2b3c99ff,
        0x3a3a0bff,
        0x8a794eff,
        0x0e1f49ff,
        0x15371cff,
        0x15273aff,
        0x375775ff,
        0x060820ff,
        0x071326ff,
        0x20394bff,
        0x2c5089ff,
        0x15426cff,
        0x103250ff,
        0x241663ff,
        0x692015ff,
        0x8c8d94ff,
        0x516013ff,
        0x090f02ff,
        0x8c573aff,
        0x52888eff,
        0x995c52ff,
        0x99581eff,
        0x993a63ff,
        0x998f4eff,
        0x99311eff,
        0x0d1842ff,
        0x521e1eff,
        0x42420dff,
        0x4c991eff,
        0x082a1dff,
        0x96821dff,
        0x197f19ff,
        0x3b141fff,
        0x745217ff,
        0x893f8dff,
        0x7e1a6cff,
        0x0b370bff,
        0x27450dff,
        0x071f24ff,
        0x784573ff,
        0x8a653aff,
        0x732617ff,
        0x319490ff,
        0x56941dff,
        0x59163dff,
        0x1b8a2fff,
        0x38160bff,
        0x041804ff,
        0x355d8eff,
        0x2e3f5bff,
        0x561a28ff,
        0x4e0e27ff,
        0x706c67ff,
        0x3b3e42ff,
        0x2e2d33ff,
        0x7b7e7dff,
        0x4a4442ff,
        0x28344eff,
    ];

    vehicleModifications = [
        { id: "1000", model: "spl_b_mar_m", type: "ug_spoiler" },
        { id: "1001", model: "spl_b_bab_m", type: "ug_spoiler" },
        { id: "1002", model: "spl_b_bar_m", type: "ug_spoiler" },
        { id: "1003", model: "spl_b_mab_m", type: "ug_spoiler" },
        { id: "1004", model: "bnt_b_sc_m", type: "bonnet_ok" },
        { id: "1005", model: "bnt_b_sc_l", type: "bonnet_ok" },
        { id: "1006", model: "rf_b_sc_r", type: "ug_roof" },
        { id: "1007", model: "wg_l_b_ssk", type: "Sideskirt" },
        { id: "1008", model: "nto_b_l", type: "ug_nitro" },
        { id: "1009", model: "nto_b_s", type: "ug_nitro" },
        { id: "1010", model: "nto_b_tw", type: "ug_nitro" },
        { id: "1011", model: "bnt_b_sc_p_m", type: "bonnet_ok" },
        { id: "1012", model: "bnt_b_sc_p_l", type: "bonnet_ok" },
        { id: "1013", model: "lgt_b_rspt", type: "Lamps" },
        { id: "1014", model: "spl_b_bar_l", type: "ug_spoiler" },
        { id: "1015", model: "spl_b_bbr_l", type: "ug_spoiler" },
        { id: "1016", model: "spl_b_bbr_m", type: "ug_spoiler" },
        { id: "1017", model: "wg_r_b_ssk", type: "Sideskirt" },
        { id: "1018", model: "exh_b_ts", type: "exhaust_ok" },
        { id: "1019", model: "exh_b_t", type: "exhaust_ok" },
        { id: "1020", model: "exh_b_l", type: "exhaust_ok" },
        { id: "1021", model: "exh_b_m", type: "exhaust_ok" },
        { id: "1022", model: "exh_b_s", type: "exhaust_ok" },
        { id: "1023", model: "spl_b_bbb_m", type: "ug_spoiler" },
        { id: "1024", model: "lgt_b_sspt", type: "Lamps" },
        { id: "1025", model: "wheel_or1", type: "wheel" },
        { id: "1026", model: "wg_l_a_s", type: "Sideskirt" },
        { id: "1027", model: "wg_r_a_s", type: "Sideskirt" },
        { id: "1028", model: "exh_a_s", type: "exhaust_ok" },
        { id: "1029", model: "exh_c_s", type: "exhaust_ok" },
        { id: "1030", model: "wg_r_c_s", type: "Sideskirt" },
        { id: "1031", model: "wg_l_c_s", type: "Sideskirt" },
        { id: "1032", model: "rf_a_s", type: "ug_roof" },
        { id: "1033", model: "rf_c_s", type: "ug_roof" },
        { id: "1034", model: "exh_a_l", type: "exhaust_ok" },
        { id: "1035", model: "rf_c_l", type: "ug_roof" },
        { id: "1036", model: "wg_l_a_l", type: "SideSkirt" },
        { id: "1037", model: "exh_c_l", type: "exhaust_ok" },
        { id: "1038", model: "rf_a_l", type: "ug_roof" },
        { id: "1039", model: "wg_l_c_l", type: "SideSkirt" },
        { id: "1040", model: "wg_r_a_l", type: "SideSkirt" },
        { id: "1041", model: "wg_r_c_l", type: "SideSkirt" },
        { id: "1042", model: "wg_l_lr_br1", type: "SideSkirt" },
        { id: "1043", model: "exh_lr_br2", type: "exhaust_ok" },
        { id: "1044", model: "exh_lr_br1", type: "exhaust_ok" },
        { id: "1045", model: "exh_c_f", type: "exhaust_ok" },
        { id: "1046", model: "exh_a_f", type: "exhaust_ok" },
        { id: "1047", model: "wg_l_a_f", type: "SideSkirt" },
        { id: "1048", model: "wg_l_c_f", type: "SideSkirt" },
        { id: "1049", model: "spl_a_f_r", type: "ug_spoiler" },
        { id: "1050", model: "spl_c_f_r", type: "ug_spoiler" },
        { id: "1051", model: "wg_r_a_f", type: "SideSkirt" },
        { id: "1052", model: "wg_r_c_f", type: "SideSkirt" },
        { id: "1053", model: "rf_c_f", type: "ug_roof" },
        { id: "1054", model: "rf_a_f", type: "ug_roof" },
        { id: "1055", model: "rf_a_st", type: "ug_roof" },
        { id: "1056", model: "wg_l_a_st", type: "Sideskirt" },
        { id: "1057", model: "wg_l_c_st", type: "Sideskirt" },
        { id: "1058", model: "spl_a_st_r", type: "ug_spoiler" },
        { id: "1059", model: "exh_c_st", type: "exhaust_ok" },
        { id: "1060", model: "spl_c_st_r", type: "ug_spoiler" },
        { id: "1061", model: "rf_c_st", type: "ug_roof" },
        { id: "1062", model: "wg_r_a_st", type: "Sideskirt" },
        { id: "1063", model: "wg_r_c_st", type: "Sideskirt" },
        { id: "1064", model: "exh_a_st", type: "exhaust_ok" },
        { id: "1065", model: "exh_a_j", type: "exhaust_ok" },
        { id: "1066", model: "exh_c_j", type: "exhaust_ok" },
        { id: "1067", model: "rf_a_j", type: "ug_roof" },
        { id: "1068", model: "rf_c_j", type: "ug_roof" },
        { id: "1069", model: "wg_l_a_j", type: "Sideskirt" },
        { id: "1070", model: "wg_l_c_j", type: "Sideskirt" },
        { id: "1071", model: "wg_r_a_j", type: "Sideskirt" },
        { id: "1072", model: "wg_r_c_j", type: "Sideskirt" },
        { id: "1073", model: "wheel_sr6", type: "wheel" },
        { id: "1074", model: "wheel_sr3", type: "wheel" },
        { id: "1075", model: "wheel_sr2", type: "wheel" },
        { id: "1076", model: "wheel_lr4", type: "wheel" },
        { id: "1077", model: "wheel_lr1", type: "wheel" },
        { id: "1078", model: "wheel_lr3", type: "wheel" },
        { id: "1079", model: "wheel_sr1", type: "wheel" },
        { id: "1080", model: "wheel_sr5", type: "wheel" },
        { id: "1081", model: "wheel_sr4", type: "wheel" },
        { id: "1082", model: "wheel_gn1", type: "wheel" },
        { id: "1083", model: "wheel_lr2", type: "wheel" },
        { id: "1084", model: "wheel_lr5", type: "wheel" },
        { id: "1085", model: "wheel_gn2", type: "wheel" },
        { id: "1086", model: "stereo", type: "Stereo" },
        { id: "1087", model: "hydralics", type: "Hydraulics" },
        { id: "1088", model: "rf_a_u", type: "ug_roof" },
        { id: "1089", model: "exh_c_u", type: "exhaust_ok" },
        { id: "1090", model: "wg_l_a_u", type: "Sideskirt" },
        { id: "1091", model: "rf_c_u", type: "ug_roof" },
        { id: "1092", model: "exh_a_u", type: "exhaust_ok" },
        { id: "1093", model: "wg_l_c_u", type: "Sideskirt" },
        { id: "1094", model: "wg_r_a_u", type: "Sideskirt" },
        { id: "1095", model: "wg_r_c_u", type: "Sideskirt" },
        { id: "1096", model: "wheel_gn3", type: "wheel" },
        { id: "1097", model: "wheel_gn4", type: "wheel" },
        { id: "1098", model: "wheel_gn5", type: "wheel" },
        { id: "1099", model: "wg_r_lr_br1", type: "Sideskirt" },
        { id: "1100", model: "misc_c_lr_rem1", type: "misc_c" },
        { id: "1101", model: "wg_r_lr_rem1", type: "Sideskirt" },
        { id: "1102", model: "wg_r_lr_sv", type: "Sideskirt" },
        { id: "1103", model: "rf_lr_bl2", type: "ug_roof" },
        { id: "1104", model: "exh_lr_bl1", type: "exhaust_ok" },
        { id: "1105", model: "exh_lr_bl2", type: "exhaust_ok" },
        { id: "1106", model: "wg_l_lr_rem2", type: "Sideskirt" },
        { id: "1107", model: "wg_r_lr_bl1", type: "Sideskirt" },
        { id: "1108", model: "wg_l_lr_bl1", type: "Sideskirt" },
        { id: "1109", model: "bbb_lr_slv1", type: "Rear Bullbars" },
        { id: "1110", model: "bbb_lr_slv2", type: "Rear Bullbars" },
        { id: "1113", model: "exh_lr_slv1", type: "exhaust_ok" },
        { id: "1114", model: "exh_lr_slv2", type: "exhaust_ok" },
        { id: "1115", model: "fbb_lr_slv1", type: "Front Bullbars" },
        { id: "1116", model: "fbb_lr_slv2", type: "Front Bullbars" },
        { id: "1117", model: "fbmp_lr_slv1", type: "bump_front_ok" },
        { id: "1118", model: "wg_l_lr_slv1", type: "Sideskirt" },
        { id: "1119", model: "wg_l_lr_slv2", type: "Sideskirt" },
        { id: "1120", model: "wg_r_lr_slv1", type: "Sideskirt" },
        { id: "1121", model: "wg_r_lr_slv2", type: "Sideskirt" },
        { id: "1122", model: "wg_l_lr_rem1", type: "Sideskirt" },
        { id: "1123", model: "misc_c_lr_rem2", type: "misc_c" },
        { id: "1124", model: "wg_r_lr_rem2", type: "Sideskirt" },
        { id: "1125", model: "misc_c_lr_rem3", type: "misc_c" },
        { id: "1126", model: "exh_lr_rem1", type: "exhaust_ok" },
        { id: "1127", model: "exh_lr_rem2", type: "exhaust_ok" },
        { id: "1128", model: "rf_lr_bl1", type: "ug_roof" },
        { id: "1129", model: "exh_lr_sv1", type: "exhaust_ok" },
        { id: "1130", model: "rf_lr_sv1", type: "ug_roof" },
        { id: "1131", model: "rf_lr_sv2", type: "ug_roof" },
        { id: "1132", model: "exh_lr_sv2", type: "exhaust_ok" },
        { id: "1133", model: "wg_l_lr_sv", type: "Sideskirt" },
        { id: "1134", model: "wg_l_lr_t1", type: "SideSkirt" },
        { id: "1135", model: "exh_lr_t2", type: "exhaust_ok" },
        { id: "1136", model: "exh_lr_t1", type: "exhaust_ok" },
        { id: "1137", model: "wg_r_lr_t1", type: "Sideskirt" },
        { id: "1138", model: "spl_a_s_b", type: "ug_spoiler" },
        { id: "1139", model: "spl_c_s_b", type: "ug_spoiler" },
        { id: "1140", model: "rbmp_c_s", type: "bump_rear_ok" },
        { id: "1141", model: "rbmp_a_s", type: "bump_rear_ok" },
        { id: "1142", model: "bntr_b_ov", type: "Vents" },
        { id: "1143", model: "bntl_b_ov", type: "Vents" },
        { id: "1144", model: "bntr_b_sq", type: "Vents" },
        { id: "1145", model: "bntl_b_sq", type: "Vents" },
        { id: "1146", model: "spl_c_l_b", type: "ug_spoiler" },
        { id: "1147", model: "spl_a_l_b", type: "ug_spoiler" },
        { id: "1148", model: "rbmp_c_l", type: "bump_rear_ok" },
        { id: "1149", model: "rbmp_a_l", type: "bump_rear_ok" },
        { id: "1150", model: "rbmp_a_f", type: "bump_rear_ok" },
        { id: "1151", model: "rbmp_c_f", type: "bump_rear_ok" },
        { id: "1152", model: "fbmp_c_f", type: "bump_front_ok" },
        { id: "1153", model: "fbmp_a_f", type: "bump_front_ok" },
        { id: "1154", model: "rbmp_a_st", type: "bump_rear_ok" },
        { id: "1155", model: "fbmp_a_st", type: "bump_front_ok" },
        { id: "1156", model: "rbmp_c_st", type: "bump_rear_ok" },
        { id: "1157", model: "fbmp_c_st", type: "bump_front_ok" },
        { id: "1158", model: "spl_c_j_b", type: "ug_spoiler" },
        { id: "1159", model: "rbmp_a_j", type: "bump_rear_ok" },
        { id: "1160", model: "fbmp_a_j", type: "bump_front_ok" },
        { id: "1161", model: "rbmp_c_j", type: "bump_rear_ok" },
        { id: "1162", model: "spl_a_j_b", type: "ug_spoiler" },
        { id: "1163", model: "spl_c_u_b", type: "ug_spoiler" },
        { id: "1164", model: "spl_a_u_b", type: "ug_spoiler" },
        { id: "1165", model: "fbmp_c_u", type: "bump_front_ok" },
        { id: "1166", model: "fbmp_a_u", type: "bump_front_ok" },
        { id: "1167", model: "rbmp_c_u", type: "bump_rear_ok" },
        { id: "1168", model: "rbmp_a_u", type: "bump_rear_ok" },
        { id: "1169", model: "fbmp_a_s", type: "bump_front_ok" },
        { id: "1170", model: "fbmp_c_s", type: "bump_front_ok" },
        { id: "1171", model: "fbmp_a_l", type: "bump_front_ok" },
        { id: "1172", model: "fbmp_c_l", type: "bump_front_ok" },
        { id: "1173", model: "fbmp_c_j", type: "bump_front_ok" },
        { id: "1174", model: "fbmp_lr_br1", type: "bump_front_ok" },
        { id: "1175", model: "fbmp_lr_br2", type: "bump_front_ok" },
        { id: "1176", model: "rbmp_lr_br1", type: "bump_rear_ok" },
        { id: "1177", model: "rbmp_lr_br2", type: "bump_rear_ok" },
        { id: "1178", model: "rbmp_lr_rem2", type: "bump_rear_ok" },
        { id: "1179", model: "fbmp_lr_rem1", type: "bump_front_ok" },
        { id: "1180", model: "rbmp_lr_rem1", type: "bump_rear_ok" },
        { id: "1181", model: "fbmp_lr_bl2", type: "bump_front_ok" },
        { id: "1182", model: "fbmp_lr_bl1", type: "bump_front_ok" },
        { id: "1183", model: "rbmp_lr_bl2", type: "bump_rear_ok" },
        { id: "1184", model: "rbmp_lr_bl1", type: "bump_rear_ok" },
        { id: "1185", model: "fbmp_lr_rem2", type: "bump_front_ok" },
        { id: "1186", model: "rbmp_lr_sv2", type: "bump_rear_ok" },
        { id: "1187", model: "rbmp_lr_sv1", type: "bump_rear_ok" },
        { id: "1188", model: "fbmp_lr_sv2", type: "bump_front_ok" },
        { id: "1189", model: "fbmp_lr_sv1", type: "bump_front_ok" },
        { id: "1190", model: "fbmp_lr_t2", type: "bump_front_ok" },
        { id: "1191", model: "fbmp_lr_t1", type: "bump_front_ok" },
        { id: "1192", model: "rbmp_lr_t1", type: "bump_rear_ok" },
        { id: "1193", model: "rbmp_lr_t2", type: "bump_rear_ok" },
    ];

    getModificationType(modid: any) {
        const match = _.filter(this.vehicleModifications, { id: `${modid}` });

        if (_.size(match) === 1) {
            return match[0];
        }

        return false;
    }

    static computeMatrix(object: any) {
        const marray = [
            parseFloat(object.matrix[0][0]),
            parseFloat(object.matrix[1][0]),
            parseFloat(object.matrix[2][0]),
            parseFloat(object.matrix[3][0]),

            parseFloat(object.matrix[0][1]),
            parseFloat(object.matrix[1][1]),
            parseFloat(object.matrix[2][1]),
            parseFloat(object.matrix[3][1]),

            parseFloat(object.matrix[0][2]),
            parseFloat(object.matrix[1][2]),
            parseFloat(object.matrix[2][2]),
            parseFloat(object.matrix[3][2]),

            parseFloat(object.matrix[0][3]),
            parseFloat(object.matrix[1][3]),
            parseFloat(object.matrix[2][3]),
            parseFloat(object.matrix[3][3]),
        ];

        return new THREE.Matrix4().fromArray(marray);
    }

    getVehicleModelName(modelid: number): string {
        return _.get(this.vehicleModelNames, modelid);
    }

    getVehicleName(modelid: number): string {
        return _.get(this.vehicleNames, modelid);
    }

    getVehicleColor(colorid: number): number {
        return _.get(this.vehicleColors, colorid) >> 8;
    }

    constructor() {
        Service.instance = this;
    }
}
