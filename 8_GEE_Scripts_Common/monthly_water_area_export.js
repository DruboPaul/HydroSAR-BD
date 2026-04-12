/************************************************************
 MONTHLY WATER AREA DATA EXPORT (GMM METHOD)
 Bangladesh National + 8 Divisions
 2015-2025, all 12 months
 
 OUTPUT: Result tables will be printed to the Console
 - National: 12 months x 11 years = 132 values
 - Division: 8 divisions x July x 11 years = 88 values
 
 HOW TO USE:
 1. Paste into GEE and click Run.
 2. Wait 10-20 minutes for results to appear in the Console.
 3. Copy results and paste into Excel/CSV for analysis.
 ************************************************************/

/* -------------------- Datasets -------------------- */
var _bdBase = ee.FeatureCollection('FAO/GAUL/2015/level1')
    .filter(ee.Filter.eq('ADM0_NAME', 'Bangladesh'));
var bdBoundary = ee.FeatureCollection([ee.Feature(_bdBase.geometry(), {name: 'Bangladesh'})]);
var divisions = _bdBase;

/* -------------------- Parameters -------------------- */
// Change this year and run multiple times if GEE server timeouts occur
var years = [2015]; 

var monthMap = {
    'January': '01', 'February': '02', 'March': '03', 'April': '04',
    'May': '05', 'June': '06', 'July': '07', 'August': '08',
    'September': '09', 'October': '10', 'November': '11', 'December': '12'
};
var monthEndDays = {
    'January': '31', 'February': '28', 'March': '31', 'April': '30',
    'May': '31', 'June': '30', 'July': '31', 'August': '31',
    'September': '30', 'October': '31', 'November': '30', 'December': '31'
};
var thresholdsDict = {"1.0": {"Bagerhat": -10.28210749710583, "Bandarban": -7.501890439961232, "Barguna": -15.676117735393309, "Barisal": -15.39554351958063, "Bhola": -15.986345899196772, "Bogra": -15.0189930719153, "Brahamanbaria": -10.02649938946826, "Chandpur": -15.305515485890004, "Chittagong": -8.814513976980813, "Chuadanga": -8.950137476854918, "Comilla": -8.881806891359517, "Cox's Bazar": -8.95734848057142, "Dhaka": -8.288593544827007, "Dinajpur": -10.122275726331772, "Faridpur": -11.97080051346406, "Feni": -8.867090303756576, "Gaibandha": -17.24065585143448, "Gazipur": -8.357676431777582, "Gopalganj": -9.596309765441156, "Habiganj": -10.182263737249286, "Jamalpur": -11.853143765680352, "Jessore": -11.340089170011256, "Jhalokati": -13.214585722352943, "Jhenaidah": -9.43018271259618, "Joypurhat": -9.3133259468968, "Khagrachhari": -7.78797754950784, "Khulna": -10.615790295496506, "Kishoreganj": -10.359427108894934, "Kurigram": -14.211528910855654, "Kushtia": -13.823694198469443, "Lakshmipur": -16.06135761091554, "Lalmonirhat": -11.737016790864397, "Madaripur": -14.550357652234496, "Magura": -9.936744561571238, "Manikganj": -14.955251237687127, "Maulvibazar": -9.894411661758785, "Meherpur": -8.978175752181428, "Munshiganj": -15.5052184112383, "Mymensingh": -9.15454865573275, "Naogaon": -10.260187299931813, "Narail": -12.507599744501936, "Narayanganj": -9.032575696192874, "Narsingdi": -14.639290614299268, "Natore": -9.583016260312863, "Nawabganj": -10.350879906229103, "Netrakona": -10.336733778804788, "Nilphamari": -12.0128886941875, "Noakhali": -15.77069283307158, "Pabna": -10.960917653362358, "Panchagarh": -9.377648092789066, "Patuakhali": -15.636595655645412, "Pirojpur": -13.665657056958583, "Rajbari": -15.044282159744744, "Rajshahi": -11.09040985622288, "Rangamati": -12.126974463255245, "Rangpur": -11.834343852255405, "Satkhira": -11.183772204347722, "Shariatpur": -16.01057456855539, "Sherpur": -8.785039118084878, "Sirajganj": -14.8172979449903, "Sunamganj": -13.779791097722583, "Sylhet": -10.32683874141309, "Tangail": -8.839810124021302, "Thakurgaon": -9.594061326711657, "national_mean": -11.65176862807997}, "2.0": {"Bagerhat": -10.466728182246982, "Bandarban": -7.64118850236103, "Barguna": -15.950802900044096, "Barisal": -15.149331835310951, "Bhola": -16.304527311727238, "Bogra": -10.194665043877622, "Brahamanbaria": -9.680097754222942, "Chandpur": -16.126273960289424, "Chittagong": -8.99012169977463, "Chuadanga": -8.947082618704876, "Comilla": -8.761238038118886, "Cox's Bazar": -9.507856673956663, "Dhaka": -8.412930541666354, "Dinajpur": -11.018855978327055, "Faridpur": -10.03025903314368, "Feni": -8.94630677101503, "Gaibandha": -13.779406381793509, "Gazipur": -8.195808174090933, "Gopalganj": -8.857719762454995, "Habiganj": -9.768861326564751, "Jamalpur": -10.554811399702457, "Jessore": -10.71287845011368, "Jhalokati": -13.387406151212536, "Jhenaidah": -9.603834744151929, "Joypurhat": -9.897462213792044, "Khagrachhari": -8.063951435725848, "Khulna": -11.315440023495707, "Kishoreganj": -9.498470309383745, "Kurigram": -14.688084968536227, "Kushtia": -12.609318327947928, "Lakshmipur": -16.132794000637734, "Lalmonirhat": -8.095508870425972, "Madaripur": -14.666341253904038, "Magura": -9.838801281587104, "Manikganj": -15.470172869634132, "Maulvibazar": -9.58565623422944, "Meherpur": -9.347050147372991, "Munshiganj": -14.91265372916211, "Mymensingh": -8.787363737137325, "Naogaon": -9.918828834012194, "Narail": -12.459252056093556, "Narayanganj": -8.400361576243068, "Narsingdi": -14.24966971523016, "Natore": -9.675390466416472, "Nawabganj": -10.54538306816212, "Netrakona": -9.449615275620486, "Nilphamari": -9.76934236125302, "Noakhali": -15.669501583292776, "Pabna": -10.372006558117436, "Panchagarh": -9.264077203050014, "Patuakhali": -15.650601826100358, "Pirojpur": -14.19159004890476, "Rajbari": -15.754763957691535, "Rajshahi": -10.00074175515725, "Rangamati": -14.176364933494892, "Rangpur": -9.594156673647136, "Satkhira": -11.510795170276452, "Shariatpur": -16.542763786810966, "Sherpur": -8.911195365687496, "Sirajganj": -16.019452007078794, "Sunamganj": -10.56179811758639, "Sylhet": -10.16277562851251, "Tangail": -9.327128220756878, "Thakurgaon": -9.59777385419591, "national_mean": -11.33864676064433}, "3.0": {"Bagerhat": -10.703871650312728, "Bandarban": -7.667626659137171, "Barguna": -15.280925587403528, "Barisal": -15.09718945841527, "Bhola": -15.468506426895097, "Bogra": -10.165802812878638, "Brahamanbaria": -9.88791942510499, "Chandpur": -14.93128923560143, "Chittagong": -8.816306134969464, "Chuadanga": -8.866202623888595, "Comilla": -8.606557752776292, "Cox's Bazar": -9.349374669769023, "Dhaka": -8.431708271956866, "Dinajpur": -9.289674063175651, "Faridpur": -9.949211999798797, "Feni": -8.588844872853205, "Gaibandha": -13.872191283983232, "Gazipur": -8.179128171187058, "Gopalganj": -9.23720874222723, "Habiganj": -9.762516570620624, "Jamalpur": -11.464733977001735, "Jessore": -9.905686627637902, "Jhalokati": -14.525439223493324, "Jhenaidah": -9.592680386976127, "Joypurhat": -8.591551835300661, "Khagrachhari": -8.02557424904593, "Khulna": -11.751879139241334, "Kishoreganj": -10.2495225189936, "Kurigram": -13.351952508176783, "Kushtia": -13.6233530973928, "Lakshmipur": -14.74551676022722, "Lalmonirhat": -9.579521210410022, "Madaripur": -14.357231215526342, "Magura": -9.84337394609434, "Manikganj": -15.115053432151331, "Maulvibazar": -9.576886492060003, "Meherpur": -9.082421631318828, "Munshiganj": -16.109041277728455, "Mymensingh": -8.597045489132404, "Naogaon": -9.176222584174884, "Narail": -13.148016740884229, "Narayanganj": -8.316601136004545, "Narsingdi": -11.576401008055525, "Natore": -9.37961558603231, "Nawabganj": -9.877571495743242, "Netrakona": -9.788677976902108, "Nilphamari": -8.352976156575108, "Noakhali": -15.78270637364584, "Pabna": -10.159855257753655, "Panchagarh": -9.280377369923052, "Patuakhali": -14.68936561983503, "Pirojpur": -14.90063732963003, "Rajbari": -15.78706481096932, "Rajshahi": -11.37013489785483, "Rangamati": -13.330163646529035, "Rangpur": -8.187192704257228, "Satkhira": -11.569219054310178, "Shariatpur": -15.872315563830227, "Sherpur": -8.274149667855049, "Sirajganj": -15.3858241721295, "Sunamganj": -10.875263126519382, "Sylhet": -9.513056152522928, "Tangail": -9.02368717177488, "Thakurgaon": -9.588468373361998, "national_mean": -11.147595084499034}, "4.0": {"Bagerhat": -9.88180521119039, "Bandarban": -7.783223377822768, "Barguna": -14.640632950067593, "Barisal": -14.400607027128084, "Bhola": -15.12399546448176, "Bogra": -9.594121952783498, "Brahamanbaria": -9.470154300351467, "Chandpur": -14.606476207068932, "Chittagong": -8.57832785446941, "Chuadanga": -9.128684712027605, "Comilla": -8.585764451280367, "Cox's Bazar": -9.4048773107856, "Dhaka": -7.943829298594534, "Dinajpur": -9.281236312844817, "Faridpur": -10.910096859172668, "Feni": -8.46581548394686, "Gaibandha": -14.987696880888434, "Gazipur": -7.734338858091485, "Gopalganj": -9.042595815069133, "Habiganj": -9.779049751449044, "Jamalpur": -9.546804115365688, "Jessore": -10.020556780018843, "Jhalokati": -13.812844962664682, "Jhenaidah": -9.552103476164936, "Joypurhat": -8.213170611451405, "Khagrachhari": -7.757961508611765, "Khulna": -12.374898525535912, "Kishoreganj": -10.276261501722402, "Kurigram": -15.264665203500623, "Kushtia": -13.805526039457776, "Lakshmipur": -14.266222166636709, "Lalmonirhat": -8.809933318808104, "Madaripur": -13.54463225235586, "Magura": -9.53926826427061, "Manikganj": -15.814712053362449, "Maulvibazar": -9.378719688068768, "Meherpur": -8.953922420113937, "Munshiganj": -14.96757655668296, "Mymensingh": -8.629635946390744, "Naogaon": -8.618656404332185, "Narail": -12.309974536878542, "Narayanganj": -8.195668921250942, "Narsingdi": -9.49640884774502, "Natore": -9.188051582065729, "Nawabganj": -9.969545845512377, "Netrakona": -10.11991476005265, "Nilphamari": -8.608484098048761, "Noakhali": -15.45002764907192, "Pabna": -10.198852397201223, "Panchagarh": -8.90881262434076, "Patuakhali": -13.999730035235656, "Pirojpur": -14.334766318903023, "Rajbari": -14.863018414059711, "Rajshahi": -10.203640301668727, "Rangamati": -12.493478017920848, "Rangpur": -7.405720029404258, "Satkhira": -11.951683859155327, "Shariatpur": -15.650269604458572, "Sherpur": -7.964931297630016, "Sirajganj": -16.37474449165605, "Sunamganj": -11.112258130008566, "Sylhet": -9.92482177619105, "Tangail": -9.062626964012424, "Thakurgaon": -9.379052608106674, "national_mean": -10.93215445290015}, "5.0": {"Bagerhat": -9.276646765438024, "Bandarban": -6.873303378829871, "Barguna": -14.081418508607326, "Barisal": -13.498473908082934, "Bhola": -14.529277246839756, "Bogra": -13.94463002838672, "Brahamanbaria": -12.2425086152625, "Chandpur": -13.989967436431431, "Chittagong": -8.020677466426896, "Chuadanga": -8.342029487039303, "Comilla": -8.116172184974644, "Cox's Bazar": -9.631930380552811, "Dhaka": -7.578412917786744, "Dinajpur": -8.091408314917272, "Faridpur": -13.088491907838728, "Feni": -7.949867874780558, "Gaibandha": -13.506628274137334, "Gazipur": -7.353520767633137, "Gopalganj": -8.14804197569347, "Habiganj": -9.489172894296628, "Jamalpur": -12.413286823767258, "Jessore": -9.637611954956286, "Jhalokati": -12.038589136608747, "Jhenaidah": -8.539968973464285, "Joypurhat": -7.69585758547391, "Khagrachhari": -6.850988441832089, "Khulna": -11.103756648467606, "Kishoreganj": -11.825865131900866, "Kurigram": -13.456897306272264, "Kushtia": -12.966400535632731, "Lakshmipur": -14.215239408749255, "Lalmonirhat": -9.524895391528192, "Madaripur": -12.866709738970536, "Magura": -8.669768963744207, "Manikganj": -15.42995803393462, "Maulvibazar": -10.423174438492168, "Meherpur": -8.153576983514213, "Munshiganj": -15.03636519187475, "Mymensingh": -7.424773237370605, "Naogaon": -8.142876329428745, "Narail": -11.753499220774764, "Narayanganj": -10.951257411241606, "Narsingdi": -14.094621609727666, "Natore": -8.153325446349237, "Nawabganj": -11.106223378300667, "Netrakona": -10.149344091471056, "Nilphamari": -7.636915046363905, "Noakhali": -14.666212910424058, "Pabna": -12.015359018674642, "Panchagarh": -7.990641502437999, "Patuakhali": -13.267601784916964, "Pirojpur": -12.94435092333, "Rajbari": -12.906004868594776, "Rajshahi": -10.555185522620675, "Rangamati": -11.934997812434752, "Rangpur": -7.602359334536734, "Satkhira": -11.065476738329778, "Shariatpur": -14.387732642328512, "Sherpur": -7.0535833607680525, "Sirajganj": -15.318466830272916, "Sunamganj": -12.850265436741283, "Sylhet": -11.529545890433868, "Tangail": -10.605946879273352, "Thakurgaon": -8.492804651174378, "national_mean": -10.831263482835329}, "6.0": {"Bagerhat": -8.733329328689338, "Bandarban": -6.158426958535452, "Barguna": -13.4152193662338, "Barisal": -12.953842686954289, "Bhola": -14.506538165403242, "Bogra": -13.576335702832417, "Brahamanbaria": -12.91836295778938, "Chandpur": -13.036191745167434, "Chittagong": -7.764487511948331, "Chuadanga": -8.318115301016947, "Comilla": -8.291076843031039, "Cox's Bazar": -10.747494718711838, "Dhaka": -8.21871381400917, "Dinajpur": -7.420296726886548, "Faridpur": -12.553052268404484, "Feni": -7.812404788077628, "Gaibandha": -13.80795475548985, "Gazipur": -8.313528567598347, "Gopalganj": -9.185992246081486, "Habiganj": -11.792659463886258, "Jamalpur": -13.103439136717968, "Jessore": -10.514759733345617, "Jhalokati": -10.73729660477166, "Jhenaidah": -8.355905652615974, "Joypurhat": -7.213084298320566, "Khagrachhari": -6.521487443474474, "Khulna": -10.052318282196518, "Kishoreganj": -13.639325049870694, "Kurigram": -13.59117097651158, "Kushtia": -12.7584614656332, "Lakshmipur": -13.92156701929374, "Lalmonirhat": -11.242315205713156, "Madaripur": -10.992542944047054, "Magura": -9.223927234123607, "Manikganj": -14.012881527377647, "Maulvibazar": -11.948399770456284, "Meherpur": -8.00984846165113, "Munshiganj": -13.808894003544324, "Mymensingh": -8.223858828226346, "Naogaon": -8.744249536118632, "Narail": -11.000310981545622, "Narayanganj": -14.180442904959532, "Narsingdi": -13.425878609014465, "Natore": -9.838656555858234, "Nawabganj": -11.429323091722344, "Netrakona": -12.119067398306967, "Nilphamari": -8.345461568728734, "Noakhali": -12.704206254773185, "Pabna": -12.94617438611566, "Panchagarh": -7.693948997416036, "Patuakhali": -13.021227944085128, "Pirojpur": -10.961738679137364, "Rajbari": -12.471397094326932, "Rajshahi": -12.494325482032671, "Rangamati": -10.458207573239983, "Rangpur": -7.321726104472092, "Satkhira": -10.601449003942244, "Shariatpur": -13.062877136627796, "Sherpur": -8.25766078124925, "Sirajganj": -14.244896149650318, "Sunamganj": -14.506804904617915, "Sylhet": -13.17836706762344, "Tangail": -11.641890550141952, "Thakurgaon": -7.702093089509943, "national_mean": -10.933560771872738}, "7.0": {"Bagerhat": -8.76296480063412, "Bandarban": -6.120248591315246, "Barguna": -13.467796298967444, "Barisal": -13.117433212177728, "Bhola": -15.157899609081303, "Bogra": -13.370567312054884, "Brahamanbaria": -13.598649296814, "Chandpur": -12.821219910456811, "Chittagong": -7.947725131770816, "Chuadanga": -8.17985233859879, "Comilla": -9.085380287868652, "Cox's Bazar": -11.367516070581134, "Dhaka": -12.799056862200406, "Dinajpur": -9.841129885514148, "Faridpur": -12.300747886489043, "Feni": -8.433642419239286, "Gaibandha": -15.561550471517387, "Gazipur": -8.798601086784638, "Gopalganj": -9.508895960020563, "Habiganj": -12.08621282621192, "Jamalpur": -14.526773754779116, "Jessore": -10.879987083321645, "Jhalokati": -10.27911644409708, "Jhenaidah": -9.62235438497444, "Joypurhat": -10.880948902004478, "Khagrachhari": -6.474309738559509, "Khulna": -9.105605077059392, "Kishoreganj": -16.092722694596826, "Kurigram": -15.689085952980806, "Kushtia": -13.09654210205864, "Lakshmipur": -14.516219165562156, "Lalmonirhat": -10.046876100780862, "Madaripur": -11.847284821229344, "Magura": -9.966861147955784, "Manikganj": -13.886728971453056, "Maulvibazar": -11.285936457385864, "Meherpur": -7.784539169724075, "Munshiganj": -13.197236835399911, "Mymensingh": -9.070694734188352, "Naogaon": -11.567875333815728, "Narail": -10.64558208457412, "Narayanganj": -14.600761189678208, "Narsingdi": -13.31925395137394, "Natore": -11.788475749164752, "Nawabganj": -12.61065319057948, "Netrakona": -14.516515619041222, "Nilphamari": -9.185384469634853, "Noakhali": -12.15027207219079, "Pabna": -12.992924739323444, "Panchagarh": -8.953848226728228, "Patuakhali": -12.875299190302767, "Pirojpur": -10.541379734656047, "Rajbari": -12.846671304562706, "Rajshahi": -12.323776779799273, "Rangamati": -12.115666263155072, "Rangpur": -8.151703057175707, "Satkhira": -9.980162004719272, "Shariatpur": -12.550415057997002, "Sherpur": -9.258056650069763, "Sirajganj": -15.359248516389318, "Sunamganj": -16.029184510167884, "Sylhet": -13.683833172319243, "Tangail": -12.70227151462952, "Thakurgaon": -9.66837396520361, "national_mean": -11.578039095994713}, "8.0": {"Bagerhat": -8.794025416670047, "Bandarban": -6.253320734325962, "Barguna": -12.824672167304614, "Barisal": -13.106830269088318, "Bhola": -16.064057518238798, "Bogra": -12.454822285877585, "Brahamanbaria": -14.807269076027143, "Chandpur": -12.694047706837642, "Chittagong": -8.154591230758648, "Chuadanga": -8.448427209792133, "Comilla": -9.77682994385091, "Cox's Bazar": -11.391659873726129, "Dhaka": -13.419842051339153, "Dinajpur": -9.46711658689926, "Faridpur": -12.588266284001252, "Feni": -9.402056927474517, "Gaibandha": -15.70667384991417, "Gazipur": -9.87778445624934, "Gopalganj": -9.660262041242092, "Habiganj": -13.156436146817038, "Jamalpur": -14.543271307529892, "Jessore": -11.643617460000526, "Jhalokati": -10.062472252798187, "Jhenaidah": -9.361800241281626, "Joypurhat": -8.552485464514948, "Khagrachhari": -6.575984501280467, "Khulna": -8.645805367882817, "Kishoreganj": -16.71544568652831, "Kurigram": -15.31478754189093, "Kushtia": -14.077261037238827, "Lakshmipur": -13.984411400826197, "Lalmonirhat": -9.853228720962692, "Madaripur": -12.484208204734, "Magura": -11.756529474713531, "Manikganj": -13.884416829158242, "Maulvibazar": -12.802852572407318, "Meherpur": -8.141553787843929, "Munshiganj": -13.801191634719853, "Mymensingh": -9.397779756463056, "Naogaon": -12.40558795637641, "Narail": -11.609833582108894, "Narayanganj": -14.64894925163888, "Narsingdi": -13.48837250319272, "Natore": -12.584045443539964, "Nawabganj": -14.534892326428391, "Netrakona": -15.988396650741144, "Nilphamari": -8.982189623836994, "Noakhali": -12.276872085537292, "Pabna": -13.49781528904477, "Panchagarh": -8.779785502696075, "Patuakhali": -12.899104675420796, "Pirojpur": -10.047344674542602, "Rajbari": -13.301110006028129, "Rajshahi": -14.634128268373289, "Rangamati": -11.652270739109788, "Rangpur": -8.52877155479607, "Satkhira": -9.850619591011448, "Shariatpur": -13.002721674918094, "Sherpur": -9.803043281351004, "Sirajganj": -15.530124688280956, "Sunamganj": -16.046137626376034, "Sylhet": -13.50200718491756, "Tangail": -12.60046304068605, "Thakurgaon": -8.976985489036894, "national_mean": -11.856557308268755}, "9.0": {"Bagerhat": -8.859698337436885, "Bandarban": -6.190225331828625, "Barguna": -13.959034667226796, "Barisal": -13.07891917670747, "Bhola": -15.293221751719262, "Bogra": -12.723002088698069, "Brahamanbaria": -15.401214548155968, "Chandpur": -12.793464783372013, "Chittagong": -8.633392798915851, "Chuadanga": -8.247237843441598, "Comilla": -9.053273109619312, "Cox's Bazar": -15.677363837835076, "Dhaka": -14.57824548336603, "Dinajpur": -8.732053610556584, "Faridpur": -12.723869084043622, "Feni": -8.654895240266352, "Gaibandha": -15.502070858310436, "Gazipur": -11.013152726364464, "Gopalganj": -9.711821044253064, "Habiganj": -14.25097180213965, "Jamalpur": -14.524550480514142, "Jessore": -12.438785776859287, "Jhalokati": -10.613789745408685, "Jhenaidah": -8.94405727025218, "Joypurhat": -8.418772558148582, "Khagrachhari": -7.404248747681962, "Khulna": -8.956954359376999, "Kishoreganj": -16.02895654451298, "Kurigram": -15.553217080805725, "Kushtia": -14.604515814927094, "Lakshmipur": -14.290796213175906, "Lalmonirhat": -9.829770354701123, "Madaripur": -12.655985055267632, "Magura": -12.504313322484483, "Manikganj": -14.34429683180154, "Maulvibazar": -12.676602654575223, "Meherpur": -8.154772802807274, "Munshiganj": -13.69403527242617, "Mymensingh": -8.31002985288173, "Naogaon": -11.174877055505227, "Narail": -11.794672875716952, "Narayanganj": -14.573833899110449, "Narsingdi": -13.901380576972617, "Natore": -13.704425421134149, "Nawabganj": -15.549333656141709, "Netrakona": -14.8098282611176, "Nilphamari": -8.715496542289891, "Noakhali": -12.240547852074044, "Pabna": -13.607223771421776, "Panchagarh": -8.7073539230352, "Patuakhali": -14.09698637262231, "Pirojpur": -9.941924552211333, "Rajbari": -13.574880903032994, "Rajshahi": -14.302156401484968, "Rangamati": -11.971135938361757, "Rangpur": -8.13616774331112, "Satkhira": -10.273690088356345, "Shariatpur": -13.15063053484261, "Sherpur": -9.0023701516274, "Sirajganj": -15.802737828719698, "Sunamganj": -15.87191036445737, "Sylhet": -12.742933712600356, "Tangail": -13.158208098983716, "Thakurgaon": -8.566239572006033, "national_mean": -12.006195702500055}, "10.0": {"Bagerhat": -9.263472383134252, "Bandarban": -6.099266683807247, "Barguna": -14.499186649588417, "Barisal": -13.218282587673064, "Bhola": -15.054675531283804, "Bogra": -12.173483245890331, "Brahamanbaria": -14.088879280304416, "Chandpur": -13.020633588772371, "Chittagong": -8.33616574074722, "Chuadanga": -8.22797261959104, "Comilla": -8.363908099195832, "Cox's Bazar": -12.444268505572484, "Dhaka": -14.707170973189903, "Dinajpur": -9.029540119454902, "Faridpur": -13.409078258234466, "Feni": -8.410822522050244, "Gaibandha": -15.564721847057855, "Gazipur": -9.946074963183689, "Gopalganj": -10.216334434749855, "Habiganj": -13.916571007833452, "Jamalpur": -12.958826750992609, "Jessore": -11.67102519931518, "Jhalokati": -11.986224408438227, "Jhenaidah": -9.2160968740771, "Joypurhat": -8.372063021049478, "Khagrachhari": -6.655367456486361, "Khulna": -10.233224480099912, "Kishoreganj": -15.270906705263435, "Kurigram": -15.765023345399172, "Kushtia": -15.652071601073985, "Lakshmipur": -14.68245149357461, "Lalmonirhat": -8.871316426894667, "Madaripur": -13.016864858835165, "Magura": -11.79291393783755, "Manikganj": -14.297354079951493, "Maulvibazar": -12.993187693016187, "Meherpur": -8.183658634248177, "Munshiganj": -13.520222347262113, "Mymensingh": -8.492376461178235, "Naogaon": -10.95396716190496, "Narail": -11.997779182087315, "Narayanganj": -14.552561815701768, "Narsingdi": -14.053817035836053, "Natore": -13.638643448298156, "Nawabganj": -14.719251222672854, "Netrakona": -15.119862805879718, "Nilphamari": -8.608709573167623, "Noakhali": -13.71322900295442, "Pabna": -13.753598193421906, "Panchagarh": -9.049187648598853, "Patuakhali": -14.406799251532425, "Pirojpur": -13.158379565657867, "Rajbari": -14.767117670262422, "Rajshahi": -13.262822968773987, "Rangamati": -12.257483458246435, "Rangpur": -7.775909907431896, "Satkhira": -10.235451105345431, "Shariatpur": -13.161492669108696, "Sherpur": -8.342116658261396, "Sirajganj": -15.167857017605469, "Sunamganj": -15.934502517734108, "Sylhet": -13.1266184402575, "Tangail": -13.48802815413074, "Thakurgaon": -9.318406047909816, "national_mean": -12.002894958423285}, "11.0": {"Bagerhat": -9.594915764544682, "Bandarban": -6.454055527972216, "Barguna": -14.49618889941977, "Barisal": -13.592131658521792, "Bhola": -15.830646773919227, "Bogra": -12.117136974275263, "Brahamanbaria": -14.499683643228984, "Chandpur": -13.500484983980364, "Chittagong": -8.479195712047984, "Chuadanga": -8.740255735903759, "Comilla": -8.69512016225466, "Cox's Bazar": -11.561325590627163, "Dhaka": -11.749023012484354, "Dinajpur": -8.714338262056364, "Faridpur": -14.306317624308376, "Feni": -8.527307264400653, "Gaibandha": -15.164159071664017, "Gazipur": -7.965969631622189, "Gopalganj": -11.040946481476944, "Habiganj": -12.384950921066377, "Jamalpur": -11.968940574774685, "Jessore": -13.045229841627997, "Jhalokati": -10.97285322180033, "Jhenaidah": -9.241809055579363, "Joypurhat": -8.191401311820021, "Khagrachhari": -6.883174864516094, "Khulna": -9.79723268081921, "Kishoreganj": -15.840597346030826, "Kurigram": -15.143356320365466, "Kushtia": -14.383104771746275, "Lakshmipur": -15.74336405956633, "Lalmonirhat": -8.82462536191282, "Madaripur": -13.152872961980371, "Magura": -12.90760578654109, "Manikganj": -14.905884791580949, "Maulvibazar": -12.900851353726813, "Meherpur": -8.616691615929902, "Munshiganj": -14.095220041336, "Mymensingh": -8.785718439091744, "Naogaon": -10.001660227821016, "Narail": -12.41086401890342, "Narayanganj": -14.77624755429948, "Narsingdi": -15.459296549647656, "Natore": -13.240584689774217, "Nawabganj": -13.937266217996594, "Netrakona": -15.564211700384636, "Nilphamari": -8.54095477551234, "Noakhali": -14.591527111817513, "Pabna": -14.27374884723138, "Panchagarh": -9.021713158919525, "Patuakhali": -14.571299689854571, "Pirojpur": -11.752185895172069, "Rajbari": -14.800179472942729, "Rajshahi": -14.83730173701722, "Rangamati": -11.930867274864124, "Rangpur": -7.640803598710253, "Satkhira": -10.582583767585998, "Shariatpur": -13.950788844131408, "Sherpur": -8.733360791250185, "Sirajganj": -15.078887002816884, "Sunamganj": -16.242435846232492, "Sylhet": -12.65059384032519, "Tangail": -10.31856156202337, "Thakurgaon": -8.664450740991368, "national_mean": -11.974797859574172}, "12.0": {"Bagerhat": -10.006318603099556, "Bandarban": -7.07032367468791, "Barguna": -14.698675321820463, "Barisal": -14.146625857564436, "Bhola": -15.3013699827319, "Bogra": -12.061582562264768, "Brahamanbaria": -10.89981699127133, "Chandpur": -14.447239575449585, "Chittagong": -8.550158209916507, "Chuadanga": -8.456356792268151, "Comilla": -8.965684370877343, "Cox's Bazar": -8.66882426770002, "Dhaka": -8.200658740350576, "Dinajpur": -9.401754901949024, "Faridpur": -14.67453812978888, "Feni": -8.685120705812427, "Gaibandha": -14.434374347900222, "Gazipur": -8.263409535571936, "Gopalganj": -10.818273976006475, "Habiganj": -10.953208021402029, "Jamalpur": -11.156675068387353, "Jessore": -12.95180535810673, "Jhalokati": -11.78093182362454, "Jhenaidah": -9.215465840030117, "Joypurhat": -7.922995356239449, "Khagrachhari": -7.326650542382978, "Khulna": -10.627969374894358, "Kishoreganj": -15.65788747739124, "Kurigram": -14.766940434290944, "Kushtia": -13.398135604177885, "Lakshmipur": -15.387077215735912, "Lalmonirhat": -8.59749403184457, "Madaripur": -13.25397914437413, "Magura": -9.764523319693009, "Manikganj": -15.153272825687736, "Maulvibazar": -11.622088091281476, "Meherpur": -8.389352728698553, "Munshiganj": -15.421600699455292, "Mymensingh": -9.065907058052334, "Naogaon": -9.682844351866123, "Narail": -11.91106614674998, "Narayanganj": -9.096004568508857, "Narsingdi": -15.676610141999118, "Natore": -10.468677188450927, "Nawabganj": -11.4208745987775, "Netrakona": -12.494641001860376, "Nilphamari": -8.402932234852118, "Noakhali": -13.783722863744556, "Pabna": -11.884551447683378, "Panchagarh": -9.210186600988957, "Patuakhali": -14.372424884047042, "Pirojpur": -11.99730048369953, "Rajbari": -14.42347984528228, "Rajshahi": -12.022047286742344, "Rangamati": -12.20675816694955, "Rangpur": -8.165673342269244, "Satkhira": -10.676332882955412, "Shariatpur": -14.894846853049083, "Sherpur": -8.31500207396965, "Sirajganj": -15.265087147853462, "Sunamganj": -16.32111707213898, "Sylhet": -11.486115856460389, "Tangail": -9.09128933120628, "Thakurgaon": -9.63740173162567, "national_mean": -11.454250854164265}};
// Original years array moved to top of file
var months = Object.keys(monthMap);
var SCALE = 250;  // 250m scale for stable national processing to avoid GEE timeouts

/* -------------------- Helper Function -------------------- */
function getWaterAreaKm2(regionGeom, year, monthName, districtName) {
    var mm = monthMap[monthName];
    var start = year + '-' + mm + '-01';
    var end = year + '-' + mm + '-' + monthEndDays[monthName];

    var col = ee.ImageCollection('COPERNICUS/S1_GRD')
        .filterBounds(regionGeom)
        .filterDate(start, end)
        .filter(ee.Filter.eq('instrumentMode', 'IW'))
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
        .select('VV');

    // Create a solid median image. If empty, it's masked out.
    var median = col.median().clip(regionGeom);

    // ==========================================
    // JS DICTIONARY LOOKUP LOGIC
    // ==========================================
    // JavaScript object lookup is completely Client-Side, resolving instantly
    var monthKey = mm + '.0'; // JSON keys are "1.0", "2.0", etc based on pandas extracted floats
    if (mm[0] === '0') {
        monthKey = mm.substring(1) + '.0';
    } else {
        monthKey = mm + '.0';
    }

    var mDict = thresholdsDict[monthKey];
    
    // Default to a sensible fallback if dictionary somehow fails
    var rawThreshold = -15.0; 
    
    if (mDict) {
        if (districtName && mDict[districtName]) {
            rawThreshold = mDict[districtName];
        } else if (mDict["national_mean"]) {
            rawThreshold = mDict["national_mean"];
        }
    }

    // Now convert the purely client-side raw JS Float to a Server-Side GEE Number
    var finalThreshold = ee.Number(rawThreshold);
    // ==========================================

    // Pixels less than threshold are water (returns 1 for true, 0 for false)
    var water = median.lt(finalThreshold);

    // Area: multiply by pixel area, update mask to ignore 0s completely
    // Using updateMask is safer than selfMask in older GEE APIs.
    var waterAreaImg = ee.Image.pixelArea().multiply(water).updateMask(water.gt(0));

    // Reduce over region
    var areaDict = waterAreaImg.reduceRegion({
        reducer: ee.Reducer.sum(), // Standard sum is more reliable for large country-wide masks
        geometry: regionGeom,
        scale: SCALE,
        maxPixels: 1e13,
        bestEffort: true,
        tileScale: 16
    });

    // If no water (or no image), sum could be null. Cast to 0 safely.
    var sumVal = areaDict.get('area');
    
    // We do a safe check: if the list of values in the dictionary is empty or null, return 0.0
    var finalVal = ee.Number(
        ee.Algorithms.If(
            ee.Algorithms.IsEqual(sumVal, null), 
            0.0, 
            sumVal
        )
    );

    return finalVal.divide(1e6);  // km2
}

/* ====================================================
   PART 1: NATIONAL MONTHLY WATER AREA
   (12 months x 10 years = 120 values)
   This fills Table: Monthly Surface Water (Section 5.2)
   ==================================================== */

print('╔══════════════════════════════════════════╗');
print('║  PART 1: NATIONAL MONTHLY WATER AREA     ║');
print('║  Bangladesh | 2015-2025 | 12 months       ║');
print('╚══════════════════════════════════════════╝');
print('Format: Year | Month | Water Area (km2)');
print('---');

var bdGeom = bdBoundary.geometry();

// We need a dummy name for the national average calculation
var nationalDummyName = "";

years.forEach(function (year) {
    months.forEach(function (m) {
        var area = getWaterAreaKm2(bdGeom, year, m, nationalDummyName);
        area.evaluate(function (a) {
             if (a === null || a === undefined) {
                 print(year + ' | ' + m + ' | ' + '0.0 km2 (No Data)');
             } else {
                 print(year + ' | ' + m + ' | ' + a.toFixed(1) + ' km2');
             }
        });
    });
});

/* ====================================================
   PART 2: DIVISION-LEVEL JULY PEAK WATER AREA
   (8 divisions x 10 years = 80 values)
   This fills Table: Trend Analysis (Section 5.5)
   ==================================================== */

print('');
print('╔══════════════════════════════════════════╗');
print('║  PART 2: DIVISION JULY WATER AREA         ║');
print('║  8 Divisions | 2015-2025 | July only       ║');
print('╚══════════════════════════════════════════╝');
print('Format: Division | Year | July Water Area (km2)');
print('---');

var divNames = divisions.aggregate_array('ADM1_NAME').sort();

divNames.evaluate(function (names) {
    names.forEach(function (divName) {
        var divGeom = divisions
            .filter(ee.Filter.eq('ADM1_NAME', divName))
            .first().geometry();

        years.forEach(function (year) {
            // Note: If you want true district-level accuracy, you need to map over districts, 
            // not divisions. Since this is an aggregate of division, we pass an empty string 
            // for the regional calculation to average the district thresholds.
            var area = getWaterAreaKm2(divGeom, year, 'July', "");
            area.evaluate(function (a) {
                 if (a === null || a === undefined) {
                     print(divName + ' | ' + year + ' | 0.0 km2 (No Data)');
                 } else {
                     print(divName + ' | ' + year + ' | ' + a.toFixed(1) + ' km2');
                 }
            });
        });
    });
});

/* ====================================================
   PART 3: SENTINEL-1 SCENE COUNT PER YEAR
   This fills Table: S1 Count (Section 3.1)
   ==================================================== */

print('');
print('╔══════════════════════════════════════════╗');
print('║  PART 3: S1 SCENE COUNT PER YEAR          ║');
print('╚══════════════════════════════════════════╝');

years.forEach(function (year) {
    var count = ee.ImageCollection('COPERNICUS/S1_GRD')
        .filterBounds(bdGeom)
        .filterDate(year + '-01-01', year + '-12-31')
        .filter(ee.Filter.eq('instrumentMode', 'IW'))
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
        .size();

    count.evaluate(function (n) {
        if (n === null || n === undefined) {
            print('S1 Scenes ' + year + ': 0');
        } else {
            print('S1 Scenes ' + year + ': ' + n);
        }
    });
});
