// sprites.js — all pixel art in the app, drawn as text. One character = one pixel.
// Generated from the art sources, but plain enough to edit by hand: change a letter, change a pixel.
export const PAL = {"k": "#1b1426", "K": "#3a2a40", "w": "#ffffff", "W": "#f4e9d0", "V": "#d9c7a0", "y": "#ffd54a", "Y": "#e9a42a", "o": "#c46a1b", "b": "#8a5a2e", "B": "#55331d", "r": "#e0433a", "R": "#9d2530", "g": "#5cc25a", "G": "#2f7f3f", "H": "#1f5a33", "l": "#b7ea7c", "c": "#7fdcff", "C": "#2f7fb8", "p": "#b56be6", "P": "#6d3aa3", "s": "#cfc8ba", "S": "#8a8478", "n": "#f2c09a", "m": "#ff9ecb", "M": "#d0568f", "e": "#e9f6ff", "t": "#9be3c0", "f": "#ff7a2f", "F": "#ffe066", "z": "#5a4c66"};

export const SPR = {
"dragon_up_idle": ".........kk...k...k.......|.....kk.kttk.kWkkkWk......|....kttkktGkktWkgkWgkk....|.....kGttttttGkggggggGk...|.....kttttGttkgggggwwgk...|......kGtttttkgggggwkggk..|......ktttGttkgggggwkgggk.|.......kGtkkkkggggggggggkk|.......ktkgYgggglmgggggGGk|........kgggggglllGGGGkkk.|.k.....kgYggggglllGkkkkk..|kgkk...kggggglglllGk......|kggGk.kgggggllllllGk......|kggGk.kgggggllllllGk......|kgggkkkgggggllllllGk......|.kgggggkggggllllllk.......|..kggggkggggllllllk.......|..kGggggkggggllllk........|...kkGGGGkggGGlggGk.......|.....kkkkkGGGkkGGGk.......|..........WkW..WkW........",
"dragon_down_idle": "..............k...k.......|..............WkkkWk......|..............WkgkWgkk....|..............kggggggGk...|.............kgggggwwgk...|.............kgggggwkggk..|.............kgggggwkgggk.|.......kkkkkkkggggggggggkk|...kkkktttkYgggglmgggggGGk|..kttttttttkggglllGGGGkkk.|.kktGtGtGYttkgglllGkkkkk..|kgkktttGttttklglllGk......|kgkttGtttGtkllllllGk......|kgktkkktGtkgllllllGk......|kggkkkkttkggllllllGk......|.kgggggkkgggllllllk.......|..kggggkggggllllllk.......|..kGggggkggggllllk........|...kkGGGGkggGGlggGk.......|.....kkkkkGGGkkGGGk.......|..........WkW..WkW........",
"dragon_up_sleep": ".........kk...k...k.......|.....kk.kttk.kWkkkWk......|....kttkktGkktWkgkWgkk....|.....kGttttttGkggggggGk...|.....kttttGttkggggggggk...|......kGtttttkgggggggggk..|......ktttGttkggggkkkgggk.|.......kGtkkkkggggggggggkk|.......ktkgYgggglmgggggGGk|........kgggggglllGGGGkkk.|.k.....kgYggggglllGkkkkk..|kgkk...kggggglglllGk......|kggGk.kgggggllllllGk......|kggGk.kgggggllllllGk......|kgggkkkgggggllllllGk......|.kgggggkggggllllllk.......|..kggggkggggllllllk.......|..kGggggkggggllllk........|...kkGGGGkggGGlggGk.......|.....kkkkkGGGkkGGGk.......|..........WkW..WkW........",
"dragon_down_sleep": "..............k...k.......|..............WkkkWk......|..............WkgkWgkk....|..............kggggggGk...|.............kggggggggk...|.............kgggggggggk..|.............kggggkkkgggk.|.......kkkkkkkggggggggggkk|...kkkktttkYgggglmgggggGGk|..kttttttttkggglllGGGGkkk.|.kktGtGtGYttkgglllGkkkkk..|kgkktttGttttklglllGk......|kgkttGtttGtkllllllGk......|kgktkkktGtkgllllllGk......|kggkkkkttkggllllllGk......|.kgggggkkgggllllllk.......|..kggggkggggllllllk.......|..kGggggkggggllllk........|...kkGGGGkggGGlggGk.......|.....kkkkkGGGkkGGGk.......|..........WkW..WkW........",
"dragon_up_angry": ".........kk...k...k.......|.....kk.kttk.kWkkkWk......|....kttkktGkktWkgkWgkk....|.....kGttttttGkggggggGk...|.....kttttGttkggggkkggk...|......kGtttttkgggggkkggk..|......ktttGttkgggggwkgggk.|.......kGtkkkkggggggggggkk|.......ktkgYgggglmgggggGGk|........kgggggglllGGGkkkk.|.k.....kgYggggglllGkkkww..|kgkk...kggggglglllGk......|kggGk.kgggggllllllGk......|kggGk.kgggggllllllGk......|kgggkkkgggggllllllGk......|.kgggggkggggllllllk.......|..kggggkggggllllllk.......|..kGggggkggggllllk........|...kkGGGGkggGGlggGk.......|.....kkkkkGGGkkGGGk.......|..........WkW..WkW........",
"dragon_down_angry": "..............k...k.......|..............WkkkWk......|..............WkgkWgkk....|..............kggggggGk...|.............kggggkkggk...|.............kgggggkkggk..|.............kgggggwkgggk.|.......kkkkkkkggggggggggkk|...kkkktttkYgggglmgggggGGk|..kttttttttkggglllGGGkkkk.|.kktGtGtGYttkgglllGkkkww..|kgkktttGttttklglllGk......|kgkttGtttGtkllllllGk......|kgktkkktGtkgllllllGk......|kggkkkkttkggllllllGk......|.kgggggkkgggllllllk.......|..kggggkggggllllllk.......|..kGggggkggggllllk........|...kkGGGGkggGGlggGk.......|.....kkkkkGGGkkGGGk.......|..........WkW..WkW........",
"fire": "....F.....|..FFyF.F..|.FyyyyyFF.|FyyyfyyyyF|.FyfffyyF.|..FfffyF..|....FF....",
"fairy0": "..ee.....ee.|.eccee.eecce|.ecccekecccc|..eccknkcce.|...eekWkee..|....kmmmk...|...kmmmmmk..|....kmmmk...|.....k.k....",
"fairy1": "...........|...ee...ee.|..eccekecce|..eccknkcce|...eekWkee.|....kmmmk..|...kmmmmmk.|....kmmmk..|.....k.k...",
"shroom": "....kkkkkk....|..kkrrrrrrkk..|.krrrrrrwrrrk.|krrrwrrrrwrrrk|krrrrrrrrrrrrk|rrrrrrwrrrwrrr|RrrwrrrrrrrrrR|kRRRRrrrrRRRRk|.kkkkWWWVkkkk.|....kWWWVk....|....kWWWVk....|....kWWWVk....|....kWWWVk....|...kWWWWWVk...",
"shroom_p": ".kkpppkk.|kppwppppk|kpppppwpk|PpppppppP|kPPpppPPk|.kkWWWkk.|..kWWWk..|..kWWWk..|..kWWWk..|...kkk...",
"shroom_b": ".kkccckk.|kccwcccck|kcccccwck|CcccccccC|kCCcccCCk|.kkWWWkk.|..kWWWk..|..kWWWk..|..kWWWk..|...kkk...",
"leaf0": "...kk|..kgk|.kglk|kgglk|kgGk.|kGk..|kk...",
"leaf1": ".kk..|kgGk.|kglGk|.kgGk|..kGk|...k.",
"leaf2": "..k..|.kok.|kyoYk|kooYk|.kYk.|..k..|..k..",
"pile0": "..............................|........kkkk...........kkkkk..|.......kyyyyk........kkGGGGGk.|.......kyyYyykk.....kyGGGHGGYk|.kkkkkkkyyyykrrkkkkkyyllFlloYk|kggggyYYryyrrrrrrGGkkyllgllYYy|kggGgYyrrRFFrRrrrYGkkkyylkyyyy|kgggglGGrrFFrrrrYYYYGGGgggyFyk|.kkkkGGHGGGyyyYYoYYYYGlgGgyYyk|....kGGGGGkkkkkYYYYYGGkggkyyk.",
"pile1": ".............kk...............|.kk...kkkk..krrk.........kk...|kYYk.kYYYYk.kWWk........kggk..|YYYYkYFYoYYkkkllkk.....kYYYgkk|YYoYYGGGGrrrrlGGlyk...kYYggggG|YYYYgggggrrRrGHGlyyk.kGYgggGgg|kkkkgGlgGgrrrGGGGllkkkGGHgglgg|krrrrgGGGrrrRrrlllllllGGGGkkkk|krrRrrrkkrrrrrrllllgllGGGk....|.kkkkkk..kkrrkkllllllGGkk.....",
"pile2": "......................kk......|.....kk..............kobkkkk..|....kllkkkkkk...kkkkkkkkkYYgkk|...kllllrrRrrk.kgggGGHGYYYoYYg|...klgllrrrrrkkggGgGGGFYYYYYYk|kkkkkllklgllk.kGGGgyrYYyyYYkk.|GGGGGkkkllllkklGHGGyyroYYylllk|GGHGFkkYYFFYYYGGGGGrrYYYYllgll|kGGlk.kYYYYYYkYGGGkkllYYlllllk|.kkk...kkkkkk.kkkk..kkkkkkkkk.",
"pile3": "..............................|..............................|......kkkk.kk..kkkkk..kkkkkkkk|.....kYYYYkGGkkGlGllkkllllyyyy|..kkkyYFYYGGHGkGlllggglgllyYyy|.kryyyrrrrGGGGkkllggGgllllkykk|krFyyYrrFrrGGk..kllyyylYYGGk..|krrryyFrrryyyk...kyyYyFYoYGk..|.kkrrkkkyyYyFk....kyyyYYYYk...|...kk...kkYYk......kgggkkk....",
"pile4": ".............kk...............|.....kkk....krrkk.............|.kkkkyyyk...kWWkgkkkk....kkkk.|kGGGyyFFyk...kgggggYYk..kllllk|GGHGyYYYFkkkkkggGgggYYkkllglll|kkkkkYYoYYGGyyYyggggGGGGGllllk|...kyYYGGGGlyyyggGggGGHGGGllrk|...kyyGGHGGGlgFggggglGGGGggggk|....kkkkGkkFllllglkkklgGggGggg|........k..kkkkllk...kgggggggk",
"pile5": "......................kk......|.............kk.kkkk.kobk.....|..kkkkk.kkk.krrkGgggkkkkk.....|kklllllkrggkGGGGggGggllk..kkkk|yyyyylllgGgglHGGGgggglglkklgll|yyYyylglgggGGlllkryllFlGlGGGll|yyyyylllFrrkllyyYFYYYYlGGHGGkk|kkkkkkkkllllkyyYYYoYYYkkgGGgk.|......kllglllyyyYYYYFyk.kgggk.|.......kllllkkyyykkyyk...kkk..",
"gold0": "....kkkkkkkk....|..kkyyyyyyyykk..|.kyyYyyyyyypyYk.|kyryyyycYyyyyyyk|kyyyyyyyyywyyywk|YYYYYYYYYYYYYYYY",
"gold1": "......kkkkkkkkkk......|....kkwyyyyyyyyykk....|..kkyyyYyyYyyyyyyykk..|.kyyyyyyyyyyyyywyyypk.|kyyyyyyyyyYyyyyYyYyyyk|kywyyyyYyyyyyyyyyyyyyk|yyyyryyyyycyyyyYyyyyYy|YYYYYYYYYYYYYYYYYYYYYY",
"gold2": "........kkkkkkkkkkkk........|......kkwyyyyyyyyyyykk......|....kkyyyyyyywyyyyyyyykk....|...kyyyyyyyyyyyyYyyyyYyyk...|..kyyyyYyyyyyyypyYyyyyyyyk..|.kywyyyywyyyyyyYyYyyyyyyyyk.|kyyyyyyyyyyyyyyyyyyyyyyyyyyk|kyyyyyyyyyyyyyyyyryywyyycyyk|yyyyyyyyyyyYyyyyyyyyyyyyywyy|YYYYYYYYYYYYYYYYYYYYYYYYYYYY",
"gold3": "..........kkkkkkkkkkkkkk..........|........kkyyyywyyyyyyyyykk........|......kkyyyywyyyyyyyyyyyyykk......|....kkyyyyyyyYyyyyyyYyyyyyyykk....|...kyyyyyYyyyyyyyyyyyyyyyyyyyyk...|..kyyywyyyyyyyyyyyyyyyyyyyyyyyyk..|.kyyyyyyyyyyyyyyyyYcYyyyyyyyyywyk.|kyyyyyyYyyyyyyyyyyYYyyyyywyyyyyyyk|kyyywyYyyyyyyyyyyyyYyyyyyyyyyyyyyk|kyyyyyyyyyyyyYywpyyyyyyyyyyyywyyyk|yyywyYyryyyYyyyyYyyyyyyyyyyyyyyyyy|YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY",
"tree": "..............|.......H......|.......H......|.......H......|......GGH.....|......GGH.....|......GGH.....|.....GGGGH....|.....GGGGH....|......GGH.....|.....GGGGH....|.....GGGGH....|....GGGGGGH...|....GGGGGGH...|.....GGGGH....|....GGGGGGH...|....GGGGGGH...|...GGGGGGGGH..|..GGGGGGGGGGH.|....GGGGGGH...|....GGGGGGH...|...GGGBBBGGH..|..GGGGBBBGGGH.|.GGGGGBBBGGGGH|......BBB.....|......BBB.....",
"tree_d": "..............|.......K......|.......K......|.......K......|......HHK.....|......HHK.....|......HHK.....|.....HHHHK....|.....HHHHK....|......HHK.....|.....HHHHK....|.....HHHHK....|....HHHHHHK...|....HHHHHHK...|.....HHHHK....|....HHHHHHK...|....HHHHHHK...|...HHHHHHHHK..|..HHHHHHHHHHK.|....HHHHHHK...|....HHHHHHK...|...HHHBBBHHK..|..HHHHBBBHHHK.|.HHHHHBBBHHHHK|......BBB.....|......BBB.....",
"tree_s": "..............|.......H......|.......H......|......GGH.....|......GGH.....|......GGH.....|.....GGGGH....|.....GGGGH....|....GGGGGH....|....GGGGGGH...|....GGGGGGH...|...GGGGGGGGH..|..GGGGGGGGGGH.|...GGGBBBGGH..|..GGGGBBBGGGH.|.GGGGGBBBGGGGH|......BBB.....|......BBB.....",
"tree_sd": "..............|.......K......|.......K......|......HHK.....|......HHK.....|......HHK.....|.....HHHHK....|.....HHHHK....|....HHHHHK....|....HHHHHHK...|....HHHHHHK...|...HHHHHHHHK..|..HHHHHHHHHHK.|...HHHBBBHHK..|..HHHHBBBHHHK.|.HHHHHBBBHHHHK|......BBB.....|......BBB.....",
"coin": ".kkkk.|kyyyYk|kywyYk|kywyYk|kyyyYk|.kkkk.",
"bigcoin": "....kkkkkkkk....|...kyyyyyyyyk...|..kyyyyyyyyyyk..|.kyywwYYYYYyyyk.|kyywYYyyyyYYyyYk|kyyYYyyBByyYYyYk|kyyYyyyBByyyYyYk|kyyYyBBBBBByYyYk|kyyYyBBBBBByYyYk|kyyYyyyBByyyYyYk|kyyYYyyBByyYYyYk|kyyyYYyyyyYYyYYk|.kyyyYYYYYYyYYk.|..kyyyyyyyyYYk..|...kYYYYYYYYk...|....kkkkkkkk....",
"heart": ".kk.kk.|krrkrrk|krwrrRk|.krrrk.|..krk..|...k...",
"moon": "...kkk.|..kWWWk|.kWWkk.|.kWk...|.kWk...|.kWWkk.|..kWWWk|...kkk.",
"star": "..w..|.wFw.|wFFFw|.wFw.|..w..",
"castle": "................|..k.k......k.k..|.ksksk.kk.ksksk.|.kssskkrrkksssk.|.ksSskkrk.ksSsk.|.kssskksk.ksssk.|.kssskssskksssk.|.ksssssSssssssk.|.kssSsssssSsssk.|.kssssBBBsssssk.|.kssssBbBsssssk.|.ksSssBbBssSssk.|.kssssBbBsssssk.|.kSSSSBBBSSSSSk.|..kkkkkkkkkkkk..|................",
"bread": "................|................|....kkkkkk......|..kkooooookk....|.koobbobobook...|kobybobobybook..|koyyyyyyyyyybok.|oyYyyYyyYyyyyok.|oyyyyyyyyyyyyok.|kooYYYYYYYYYook.|.kkooooooooook..|...kkkkkkkkkk...|................|................|................|................",
"feast": "................|......kkk.......|.....koook......|....kobbbok.....|...kobobbbok....|...kobbbobbok...|...kobbbbbbok...|....kobbbobok...|.....kobbbok....|......kooWk.....|.......kWWk.....|......kWWWWk....|.......kWWk.....|........kk......|................|................",
"ale": "................|...kkkkk........|..kwwWwwk.......|.kwwwwWwwk......|.kYwwwwwYkkkk...|.kyyyyyyykbbbk..|.kyYyyyyykkkbk..|.kyYyyyyyk.kbk..|.kyYyyyyyk.kbk..|.kyYyyyyykkbk...|.kyYyyyyybbk....|.kyyyyyyykk.....|.kbbbbbbbk......|..kkkkkkk.......|................|................",
"horseshoe": "................|...kkk....kkk...|..ksssk..ksssk..|.ksSSsk..ksSSsk.|.ksssk....ksssk.|.ksSsk....ksSsk.|.ksssk....ksssk.|.ksSsk....ksSsk.|.kssssk..kssssk.|..ksSsskkssSsk..|...kssSSSSssk...|....kssssssk....|.....kkkkkk.....|................|................|................",
"sack": "................|......kkk.......|.....krrrk......|....kbbbbbk.....|.....krrrk......|....kbbbbbk.....|...kbbbbbbbk....|..kbbbbYbbbbk...|..kbbbYyYbbbk...|.kbbbbYyYbbbbk..|.kbbbbbYbbbbbk..|.kbbbbbbbbbbBk..|..kBbbbbbbbBBk..|...kBBBBBBBBk...|....kkkkkkkk....|................",
"scroll": "................|...kkkkkkkkk....|..kWWWWWWWWWk...|.kVWWWWWWWWWVk..|..kWVVVVVVVWk...|..kWWWWWWWWWk...|..kWVVVVVWWWk...|..kWWWWWWWWWk...|..kWVVVVVVVWk...|..kWWWWWWrrWk...|..kWWWWWWrRWk...|.kVWWWWWWWWWVk..|..kWWWWWWWWWk...|...kkkkkkkkk....|................|................",
"shield": "................|..kkkkkkkkkkk...|.kCCCCCCCCCCCk..|.kCyyyyyyyyyCk..|.kCyCCCyCCCyCk..|.kCyCCCyCCCyCk..|.kCyyyyyyyyyCk..|.kCyCCCyCCCyCk..|..kCyCCyCCyCk...|...kCyCyCyCk....|....kCyyyCk.....|.....kCyCk......|......kCk.......|.......k........|................|................",
"potion": "................|......kkk.......|.....kbbbk......|.....kbBbk......|.....kccck......|.....kceckk.....|...kkcceccck....|..kccpppppcck...|.kcpppwpppppck..|.kcppwppppppck..|.kcpppppppPpck..|.kcppppppPPpck..|..kcpPPPPPpck...|...kccccccck....|....kkkkkkk.....|................",
"lute": "................|...........kk...|..........kbbk..|.........kbBbk..|........kbbkk...|.......kbbk.....|....kkkbbk......|...kooobkk......|..koooooook.....|.kooooBoook.....|.koooBkBook.....|.kooooBoook.....|.koooooook......|..koooook.......|...kkkkk........|................",
"map": "................|..kkkkkkkkkkkk..|.kWWWWVWWWWVWWk.|.kWWWWVWWrWVWWk.|.kWgWWVWrWrVWWk.|.kWggWVWWrWVWWk.|.kWgWWVWrWrVWWk.|.kWWWWVWWWWVcWk.|.kWWCCVWWWWVcck.|.kWWWCCCWWWVWWk.|.kWWWWVCCCWVWWk.|.kWWWWVWWWCCWWk.|.kWWWWVWWWWVWWk.|..kkkkkkkkkkkk..|................|................",
"mirror": "................|.....kkkk.......|....kyyyyk......|...kyccccyk.....|..kyceccccyk....|..kycecccCyk....|..kycccccCyk....|..kyccccCCyk....|...kyCCCCyk.....|....kyyyyk......|.....kyYk.......|.....kyYk.......|.....kyYk.......|.....kYYk.......|......kk........|................",
"gift": "................|.....kk.kk......|....krrkrrk.....|..kkrkkrkkrk....|.kpppppyppppk...|.kpppppypppppk..|.kyyyyyyyyyyyk..|..kpppppypppk...|..kpppppypppk...|..kpppppypppk...|..kPPPPPyPPPk...|..kPPPPPYPPPk...|...kkkkkkkkk....|................|................|................",
"tome": "................|...kkkkkkkkk....|..kRRRRRRRRRk...|.kRrrrrrrrrRWk..|.kRryyyyyyrRWk..|.kRryrrrryrRWk..|.kRryrYrryrRWk..|.kRryrrrryrRWk..|.kRryyyyyyrRWk..|.kRrrrrrrrrRWk..|.kRrrrrrrrrRWk..|.kRRRRRRRRRRVk..|..kWWWWWWWWWWk..|...kkkkkkkkkk...|................|................",
"barrel": "................|....kkkkkkk.....|...kbbbbbbbk....|..kbobobobobk...|.kSSSSSSSSSSSk..|.kbobobobobobk..|.kbobobobobobk..|.kbobobobobobk..|.kSSSSSSSSSSSk..|.kbobobobobobk..|..kbobobobobk...|...kbbbbbbbk....|....kkkkkkk.....|................|................|................",
"helmet": "................|......kkk.......|.....krrrk......|....kkkrrrk.....|...ksssssk......|..ksssssssk.....|.kssssssSssk....|.ksSsssssSsk....|.ksSkkkkkSsk....|.ksSssSssSsk....|.ksSssSssSsk....|.ksSSsSsSSsk....|..kSSSSSSSk.....|...kkkkkkk......|................|................",
"candle": "................|......k.........|.....kyk........|....kyFyk.......|....kfFfk.......|.....kfk........|.....kkk........|....kWWWk.......|....kWWVk.......|....kWWVk.......|....kWWVk.......|..kkyWWVykk.....|.kYyyyyyyyYk....|..kYYYYYYYk.....|...kkkkkkk......|................",
"pouch": "................|.....kkkkk......|....kbbbbbk.....|.....krrrk......|....kbbbbbk.....|...kbbbbbbbk....|..kbbbbbbbbbk...|..kbbyyybbbbk...|..kbbyYybbbbk...|..kbbbbbbbbBk...|...kBbbbbbBBk...|....kBBBBBkk....|.....kkkkk......|................|................|................",
"coins": "................|.......kkkk.....|......kyyyyk....|.....kyYwyyyk...|.....kyyyyyYk...|...kkkkYYYYk....|..kyyyyyyyyyk...|..kYYYYYYYYYk...|..kyyyyyyyyyk...|..kYYYYYYYYYk...|..kyyyyyyyyyk...|..kYYYYYYYYYk...|...kkkkkkkkk....|................|................|................",
"seal": "................|..kkkkkkkkkk....|.kWWWWWWWWWWk...|.kWVVVVVVVVWk...|.kWWWWWWWWWWk...|.kWVVVVVVWWWk...|.kWWWWWWWWWWk...|.kWVVVVVrrrWk...|.kWWWWWrrwrrk...|.kWWWWWrrrRrk...|.kWWWWWWrRrk....|..kkkkkkrkrk....|........k.k.....|................|................|................",
"chest": "................|...kkkkkkkkkk...|..kbbbbbbbbbbk..|.kbobobobobobbk.|.kbbbbbbbbbbbbk.|.kyyyyyyyyyyyyk.|.kbbbbbyybbbbbk.|.kbobobykbobobk.|.kbbbbbyybbbbbk.|.kbobobobobobok.|.kBBBBBBBBBBBBk.|..kkkkkkkkkkkk..|................|................|................|................",
"egg": "................|......kkk.......|.....ktttk......|....ktttgtk.....|...ktgttttk.....|...ktttttgtk....|..kttgttttttk...|..kttttgttttk...|..ktgttttgttk...|..ktttttttGtk...|...kttgtttGk....|....kGGGGGk.....|.....kkkkk......|................|................|................",
"crown": "................|..k....k....k...|.kyk..kyk..kyk..|.kyykkyyykkyyk..|.kyyykyrykyyyk..|.kyyyyyyyyyyyk..|.kyyryyyyyryyk..|.kyyyyycyyyyyk..|.kYYYYYYYYYYYk..|..kkkkkkkkkkk...|................|................|................|................|................|................",
"gem": "................|....kkkkkkk.....|...kccccccck....|..kcewwcceeck...|.kceccccccccck..|.kCCCCCCCCCCCk..|..kCcccccccCk...|...kCccccCCk....|....kCcccCk.....|.....kCcCk......|......kCk.......|.......k........|................|................|................|................",
"key": "................|...kkk..........|..kyyyk.........|.kyYkyyk........|.kyk.kyk........|.kyykYyk........|..kyyyyyk.......|...kkkkkyk......|........kykkk...|.........kyyyk..|.........kyYk...|..........kyk...|...........k....|................|................|................",
"sword": "................|............kk..|...........kssk.|..........kswsk.|.........kswsk..|........kswsk...|..k....kswsk....|.kyk..kswsk.....|..kykkswsk......|...kyswsk.......|....kyyk........|...kbkyyk.......|..kbk.kyk.......|.kbk...k........|..k.............|................",
"ring": "................|......kkk.......|.....kccck......|....kcewck......|.....kcck.......|....kyyyyk......|...kyykkyyk.....|..kyyk..kyyk....|..kyk....kyk....|..kyyk..kyYk....|...kyykkYYk.....|....kYYYYk......|.....kkkk.......|................|................|................",
"mushroom": "................|.....kkkkk......|...kkrrrrrkk....|..krrwrrrwrrk...|.krrrrrrrrrrrk..|.krwrrrrwrrrrk..|.kRRRRRRRRRRRk..|..kkkWWWWkkkk...|....kWWWVk......|....kWWWVk......|...kWWWWVVk.....|....kkkkkk......|................|................|................|................",
"apple": "................|.......k.kk.....|......kbkggk....|....kkkbggk.....|...krrrbrrrk....|..krwrrrrrrrk...|..krwrrrrrrrk...|..krrrrrrrrRk...|..krrrrrrrRRk...|...krrrrrRRk....|....krrRRRk.....|.....kkkkk......|................|................|................|................",
"house": "................|......kkk.......|.....krrrk...k..|....krrrrrk.kbk.|...krrrrrrrkbbk.|..krrrrrrrrrrbk.|.krrrrrrrrrrrrk.|..kWWWWWWWWWWk..|..kWcWWWWWbbWk..|..kWWWWWWWbbWk..|..kWWWWWWWbbWk..|..kVVVVVVVbbVk..|...kkkkkkkkkk...|................|................|................",
"boat": "................|.......k........|......kbkk......|......kbWWk.....|......kbWWWk....|......kbWWWWk...|......kbWWWWWk..|..kkkkkbkkkkkk..|.kbbbbbbbbbbbbk.|..kbobobobobok..|..kkbbbbbbbbkk..|.kcCcCcCcCcCcCk.|..kkkkkkkkkkkk..|................|................|................",
"paw": "................|....kk...kk.....|...kbbk.kbbk....|..kkbbk.kbbkk...|.kbbkkkkkkkbbk..|.kbbkkbbbkkbbk..|..kkkbbbbbkkk...|...kbbbbbbbk....|...kbbbbbbbk....|....kbbkbbk.....|.....kk.kk......|................|................|................|................|................",
"cog": "................|......kk........|...k.kssk.k.....|..kskssssksk....|..kssssssssk....|..kksskksskk....|.ksssk..ksssk...|.ksssk..ksssk...|..kksskksskk....|..kssssssssk....|..kSkSSSSkSk....|...k.kSSk.k.....|......kk........|................|................|................",
"wand": "................|..........k.....|.........kFk....|........kFyFk...|.........kFk....|........kpk.....|.......kPk......|......kpk.......|.....kPk........|....kpk.........|...kPk..........|..kpk...........|...k............|................|................|................",
"flower": "................|.....k..k.......|....kmkkmk......|...kmmmmmmk.....|..kmmmyymmmk....|...kmmyymmk.....|....kmmmmk......|....kkgkkkk.....|...kggkgkggk....|....kgggggk.....|.....kkgkk......|.......k........|................|................|................|................"
};

// One-colour UI icons, 12x12 ('#' = ink, drawn in the current text colour).
export const ICO = {
"home": ".....##.....|....####.##.|...######.#.|..########..|.##########.|############|.#........#.|.#.##..##.#.|.#.##..##.#.|.#.....##.#.|.#.....##.#.|.##########.",
"list": ".#########..|#.........#.|.#.......#..|.#.#####.#..|.#.......#..|.#.####..#..|.#.......#..|.#.#####.#..|.#.......#..|.#.###...#..|#.........#.|.#########..",
"budget": "....####....|.....##.....|....####....|...#....#...|..#......#..|.#...##...#.|.#..#..#..#.|.#...##...#.|.#........#.|.#........#.|..#......#..|...######...",
"insights": "....####....|..##....##..|.#..##....#.|.#.#......#.|#.........#.|#.........#.|.#........#.|..##....##..|....####....|..########..|.#........#.|.##########.",
"more": "....####....|...#....#...|..#......#..|.##########.|.#....#...#.|.#...###..#.|.#....#...#.|.#........#.|.#........#.|.#........#.|.##########.|............",
"plus": "............|.....##.....|.....##.....|.....##.....|.....##.....|.##########.|.##########.|.....##.....|.....##.....|.....##.....|.....##.....|............",
"gear": ".....##.....|..#.####.#..|.###....###.|..#......#..|.#...##...#.|##..####..##|##..####..##|.#...##...#.|..#......#..|.###....###.|..#.####.#..|.....##.....",
"filter": "############|#..........#|.#........#.|..#......#..|...#....#...|....#..#....|....#..#....|....#..#....|....#..#....|....#.##....|....###.....|............",
"calendar": "..#.....#...|############|#..#.....#.#|############|#..........#|#.##.##.##.#|#.##.##.##.#|#..........#|#.##.##....#|#.##.##....#|#..........#|############",
"chevL": "............|.......##...|......##....|.....##.....|....##......|...##.......|...##.......|....##......|.....##.....|......##....|.......##...|............",
"chevR": "............|...##.......|....##......|.....##.....|......##....|.......##...|.......##...|......##....|.....##.....|....##......|...##.......|............",
"search": "...####.....|..#....#....|.#..##..#...|.#.#....#...|.#......#...|.#......#...|..#....#....|...#####....|.......###..|........###.|.........###|..........#.",
"x": "............|.##......##.|.###....###.|..###..###..|...######...|....####....|....####....|...######...|..###..###..|.###....###.|.##......##.|............",
"check": "............|..........##|.........###|........###.|.......###..|##....###...|###..###....|.######.....|..####......|...##.......|............|............",
"repeat": "........#...|..#######...|.#......##..|.#.......#..|.#..........|.#..........|..........#.|..........#.|..#.......#.|..##......#.|...#######..|...#........",
"target": "############|#..........#|#.#.....#..#|#..#...#...#|#...#.#....#|#....#.....#|#...#.#....#|#..#...#...#|#.#.....#..#|#.....###..#|#..........#|############",
"wallet": "...#....#...|..##....##..|..########..|.#........#.|#..........#|#....##....#|#...#..#...#|#....##....#|#..........#|#..........#|.#........#.|..########..",
"tag": "############|#..........#|#..#....#..#|#...####...#|#...#..#...#|#...####...#|#..#....#..#|#..........#|#....##....#|#...#..#...#|#..#....#..#|###......###",
"globe": "...######...|..#......#..|.#.#.##.#.#.|#..######..#|#..######..#|#..........#|#..######..#|#..........#|#..........#|.#........#.|..#......#..|...######...",
"moon": "....####....|..##..##....|.#...##.....|.#..##......|#...#.......|#...#.......|#...#.......|#....#......|.#....##...#|.#......###.|..##.....#..|....#####...",
"doc": "..########..|.#........#.|..#......#..|..#.####.#..|..#......#..|..#.###..#..|..#......#..|..#.####.#..|..#...##.#..|..#..####...|.#....##..#.|..########..",
"down": ".....##.....|.....##.....|.....##.....|.....##.....|.##..##..##.|..##.##.##..|...######...|....####....|.....##.....|............|############|############",
"up": ".....##.....|....####....|...######...|..##.##.##..|.##..##..##.|.....##.....|.....##.....|.....##.....|.....##.....|............|############|############",
"trash": ".....#......|....##......|....###..#..|...####.##..|..#######...|..###.####..|.###...###..|.##.....##..|.##.....##..|..##...##...|...#####....|............",
"info": "....####....|..##....##..|.#...##...#.|.#........#.|#....##....#|#....##....#|#....##....#|#....##....#|.#...##...#.|.#........#.|..##....##..|....####....",
"card": "............|############|#..........#|############|############|#..........#|#.###......#|#..........#|############|............|............|............",
"eyeOff": "..........##|......#####.|....##....#.|...#.....#..|..#.....##..|.#.....#.#..|.#....#..#..|.#...#...#..|.#..#...#...|..##...#....|.#.####.....|#...........",
"piggy": "..########..|.#........#.|#..........#|############|#....##....#|#...#..#...#|#....##....#|#..........#|#..........#|############|............|............",
"game": "..#....#....|..##..##....|..########..|.#........#.|.#..##.....#|#...##......|#..........#|#.....######|.#....#.....|..#...#.....|...####.....|............",
"sound": "..........##|........##.#|......##...#|#.####.....#|##.........#|##.........#|#.####.....#|......##...#|........##.#|..........##|............|............",
"sun": ".....##.....|.#...##...#.|..#......#..|....####....|...#....#...|##.#....#.##|##.#....#.##|...#....#...|....####....|..#......#..|.#...##...#.|.....##.....",
"fairy": "..##....##..|.#..#..#..#.|.#...##...#.|..#..##..#..|...#.##.#...|.....##.....|....####....|...######...|....####....|.....#.#....|..#.......#.|....#...#..."
};

export const ITEM_SPRITES = ["castle", "bread", "feast", "ale", "horseshoe", "sack", "scroll", "shield", "potion", "lute", "map", "mirror", "gift", "tome", "barrel", "helmet", "candle", "pouch", "coins", "seal", "chest", "egg", "crown", "gem", "key", "sword", "ring", "mushroom", "apple", "house", "boat", "paw", "cog", "wand", "flower"];

const svgCache = {};
function runs(rows, keep) {
  // merge horizontal runs of equal colour into rects
  const out = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      if (!keep(c)) { x++; continue; }
      let x1 = x + 1;
      while (x1 < row.length && row[x1] === c) x1++;
      out.push([x, y, x1 - x, c]);
      x = x1;
    }
  });
  return out;
}
export const dims = name => { const r = SPR[name].split('|'); return [r[0].length, r.length]; };

/** Multi-colour sprite as inline SVG. */
export function px(name, cls = '', attrs = '') {
  const key = name;
  if (!svgCache[key]) {
    const rows = (SPR[name] || SPR.coin).split('|');
    const w = rows[0].length, h = rows.length;
    const body = runs(rows, c => PAL[c]).map(([x, y, n, c]) => `<rect x="${x}" y="${y}" width="${n}" height="1" fill="${PAL[c]}"/>`).join('');
    svgCache[key] = [w, h, body];
  }
  const [w, h, body] = svgCache[key];
  return `<svg viewBox="0 0 ${w} ${h}" class="px ${cls}" shape-rendering="crispEdges" aria-hidden="true" ${attrs}>${body}</svg>`;
}

/** Two frames stacked; CSS swaps them (class "anim"). */
export function px2(a, b, cls = '') {
  return `<span class="px2 ${cls}">${px(a, 'fa')}${px(b, 'fb')}</span>`;
}

const icoCache = {};
/** One-colour 12x12 icon in currentColor. */
export function ico(name) {
  if (!icoCache[name]) {
    const rows = (ICO[name] || ICO.info).split('|');
    icoCache[name] = runs(rows, c => c === '#').map(([x, y, n]) => `M${x} ${y}h${n}v1h-${n}z`).join('');
  }
  return `<svg viewBox="0 0 12 12" class="i" shape-rendering="crispEdges" aria-hidden="true"><path d="${icoCache[name]}"/></svg>`;
}

/** Draw a sprite onto a canvas (used by the game and the PDF). */
export function draw(ctx, name, x, y, s = 1, flipX = false) {
  const rows = SPR[name].split('|');
  const w = rows[0].length;
  rows.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const col = PAL[row[i]];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(Math.round(x + (flipX ? w - 1 - i : i) * s), Math.round(y + j * s), Math.ceil(s), Math.ceil(s));
    }
  });
}
