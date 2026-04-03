// Seed tool — chèn dữ liệu giả lập thực tế vào database cho mô phỏng bảo mật IDOR.
//
// Cách dùng:
//
//	go run ./cmd/seed                    -- thêm dữ liệu (bỏ qua email trùng)
//	go run ./cmd/seed --reset            -- xóa data cũ rồi insert lại
//	go run ./cmd/seed --reset --users 20 -- tùy chỉnh số lượng user
package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"math/rand"
	"strings"
	"time"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/crypto/bcrypt"

	"ecommerce-api/models"
)

// ─── Pool tên tiếng Việt ──────────────────────────────────────────────────────

var hoViet = []string{"Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý", "Phan", "Đinh"}

var demNu = []string{"Thị", "Thị Bích", "Thị Thu", "Thị Kim", "Thị Lan", "Thị Ngọc", "Thị Hồng", "Thị Ánh", "Thị Diễm"}
var tenNu = []string{"Hương", "Lan", "Thu", "Hoa", "Linh", "Mai", "Nga", "Ánh", "Hiền", "Yến", "Thủy", "Huệ", "Hạnh", "Trang", "Khánh", "Diệu", "Phương", "Nhung", "Thảo", "Quỳnh"}

var demNam = []string{"Văn", "Quốc", "Minh", "Đức", "Hoàng", "Thanh", "Xuân", "Anh", "Hữu", "Trọng"}
var tenNam = []string{"Minh", "Nam", "Đức", "Hùng", "Long", "Tuấn", "Huy", "Cường", "Quang", "Bảo", "Dũng", "Phúc", "Khải", "Sơn", "Việt", "Trí", "Khoa", "Tài", "Lâm", "Kiên"}

// ─── Pool địa chỉ ─────────────────────────────────────────────────────────────

type thanhPho struct {
	TenTinh string
	Duong   []string
	Quan    []string
	MaCCCD  string // 3 chữ số đầu CCCD
}

var cacThanhPho = []thanhPho{
	{
		TenTinh: "Hà Nội",
		Duong:   []string{"Trần Hưng Đạo", "Hoàng Diệu", "Phan Đình Phùng", "Đội Cấn", "Nguyễn Trãi", "Bạch Mai", "Kim Mã", "Xuân Thủy", "Tô Hiệu", "Giải Phóng", "Láng Hạ", "Thái Thịnh", "Phố Huế", "Hai Bà Trưng"},
		Quan:    []string{"Hoàn Kiếm", "Ba Đình", "Đống Đa", "Hai Bà Trưng", "Cầu Giấy", "Thanh Xuân", "Long Biên", "Bắc Từ Liêm", "Nam Từ Liêm", "Tây Hồ"},
		MaCCCD:  "001",
	},
	{
		TenTinh: "Hồ Chí Minh",
		Duong:   []string{"Nguyễn Huệ", "Lê Lợi", "Đồng Khởi", "Cách Mạng Tháng 8", "Điện Biên Phủ", "Võ Văn Tần", "Nam Kỳ Khởi Nghĩa", "Nguyễn Đình Chiểu", "Lý Tự Trọng", "Hai Bà Trưng", "Phan Văn Trị", "Hoàng Văn Thụ"},
		Quan:    []string{"Quận 1", "Quận 3", "Bình Thạnh", "Tân Bình", "Phú Nhuận", "Bình Chánh", "Quận 7", "Thủ Đức", "Quận 10", "Quận 11"},
		MaCCCD:  "079",
	},
	{
		TenTinh: "Đà Nẵng",
		Duong:   []string{"Nguyễn Văn Linh", "Lê Duẩn", "Bạch Đằng", "Phan Châu Trinh", "Trần Phú", "Hoàng Diệu", "Ngô Quyền", "Nguyễn Tất Thành", "Điện Biên Phủ"},
		Quan:    []string{"Hải Châu", "Thanh Khê", "Sơn Trà", "Ngũ Hành Sơn", "Liên Chiểu", "Cẩm Lệ"},
		MaCCCD:  "048",
	},
	{
		TenTinh: "Cần Thơ",
		Duong:   []string{"30 Tháng 4", "Nguyễn Văn Cừ", "Trần Văn Khéo", "Phan Đình Phùng", "Hùng Vương", "Xô Viết Nghệ Tĩnh", "Mậu Thân"},
		Quan:    []string{"Ninh Kiều", "Bình Thủy", "Cái Răng", "Ô Môn", "Thốt Nốt"},
		MaCCCD:  "092",
	},
	{
		TenTinh: "Hải Phòng",
		Duong:   []string{"Điện Biên Phủ", "Trần Phú", "Hoàng Văn Thụ", "Quang Trung", "Lạch Tray", "Tô Hiệu", "Lê Lợi"},
		Quan:    []string{"Hồng Bàng", "Ngô Quyền", "Lê Chân", "Hải An", "Kiến An"},
		MaCCCD:  "031",
	},
}

// ─── Danh mục sản phẩm ────────────────────────────────────────────────────────

type mauSanPham struct {
	Ten        string
	DanhMuc    string
	DanhMucCon string
	GiaMin     float64
	GiaMax     float64
	Sizes      []string
	MoTa       string
}

var danhMucSP = []mauSanPham{
	// Nam - Áo
	{"Áo sơ mi trắng Oxford slim fit", "Men", "Topwear", 280000, 520000, []string{"S", "M", "L", "XL"}, "Chất liệu Oxford cao cấp, thoáng mát, thích hợp đi làm và đi chơi"},
	{"Áo thun polo cổ bẻ basic", "Men", "Topwear", 180000, 350000, []string{"S", "M", "L", "XL", "XXL"}, "Vải cotton 100%, thiết kế tối giản, dễ phối đồ cho mọi hoàn cảnh"},
	{"Áo khoác bomber unisex nhiều màu", "Men", "Topwear", 450000, 850000, []string{"S", "M", "L", "XL"}, "Chất liệu gió, lót lưới thoáng, phong cách streetwear năng động"},
	{"Áo hoodie nỉ bông in chữ", "Men", "Topwear", 320000, 620000, []string{"S", "M", "L", "XL", "XXL"}, "Bông dày ấm, mũ có dây, túi kangaroo tiện dụng"},
	{"Áo len cổ tròn mỏng basic", "Men", "Topwear", 240000, 480000, []string{"S", "M", "L", "XL"}, "Chất liệu len pha acrylic, cổ tròn vừa vặn, ấm áp mùa đông"},
	// Nam - Quần
	{"Quần jeans straight Levi's 501 rep", "Men", "Bottomwear", 350000, 650000, []string{"28", "29", "30", "31", "32", "33", "34"}, "Vải denim 12oz, đường cắt cổ điển, dáng thẳng cân đối"},
	{"Quần short kaki túi hộp", "Men", "Bottomwear", 180000, 320000, []string{"28", "29", "30", "31", "32"}, "Vải kaki có giãn, túi bên hông tiện lợi, mặc mùa hè"},
	{"Quần tây trơn slim fit công sở", "Men", "Bottomwear", 280000, 520000, []string{"28", "29", "30", "31", "32", "33", "34"}, "Chất liệu cotton pha polyester, lịch sự khi đi làm"},
	// Nữ - Áo
	{"Áo blouse lụa cổ V bồng bô", "Women", "Topwear", 220000, 420000, []string{"S", "M", "L"}, "Chất liệu lụa pha, mềm mại, sang trọng, thích hợp đi tiệc"},
	{"Áo len crop tay dài thu đông", "Women", "Topwear", 260000, 490000, []string{"S", "M", "L"}, "Kiểu dáng crop vừa, giữ ấm tốt, phong cách Hàn Quốc"},
	{"Áo thun graphic oversize nữ", "Women", "Topwear", 160000, 290000, []string{"S", "M", "L", "XL"}, "Vải cotton có giãn, in hình độc đáo, phong cách casual"},
	{"Áo cardigan mở tay bờ mỏng", "Women", "Topwear", 310000, 580000, []string{"S", "M", "L"}, "Vải pha cotton mềm, nhiều màu sắc, mặc ngoài hoặc để lẻ đều được"},
	// Nữ - Quần & Váy
	{"Váy midi hoa cúc bo tay chấm", "Women", "Bottomwear", 280000, 520000, []string{"S", "M", "L"}, "Chất liệu voan nhẹ, họa tiết hoa nhỏ, thanh lịch nữ tính"},
	{"Quần culottes vải nhung hè thu", "Women", "Bottomwear", 240000, 460000, []string{"S", "M", "L"}, "Vải nhung mềm, dáng rộng thoáng mát, trẻ trung"},
	{"Quần jean ống rộng wide leg nữ", "Women", "Bottomwear", 320000, 580000, []string{"26", "27", "28", "29", "30"}, "Denim nhẹ, ống rộng phong cách, tôn dáng đẹp"},
	// Trẻ em
	{"Bộ đồ thể thao trẻ em cotton", "Kids", "Topwear", 140000, 260000, []string{"3T", "4T", "5T", "6T", "7T", "8T"}, "100% cotton, thoáng mát, dễ giặt, phù hợp vận động"},
	{"Áo khoác gió trẻ em unisex", "Kids", "Topwear", 160000, 280000, []string{"3T", "4T", "5T", "6T", "7T", "8T"}, "Nhẹ, ấm, nhiều màu sắc tươi sáng"},
	// Phụ kiện
	{"Túi xách mini vintage da PU", "Accessories", "Bags", 190000, 380000, []string{"One Size"}, "Da PU cao cấp, dây đeo điều chỉnh được, phong cách vintage"},
	{"Thắt lưng da bò nguyên tấm", "Accessories", "Belts", 220000, 420000, []string{"100cm", "105cm", "110cm", "115cm"}, "Da bò thật, khóa hợp kim, bền đẹp theo thời gian"},
	{"Mũ bucket thêu logo thủ công", "Accessories", "Hats", 120000, 220000, []string{"One Size"}, "Vải cotton, vành rộng che nắng, có thể điều chỉnh"},
	{"Kính mát phi công UV400 trầm", "Accessories", "Sunglasses", 150000, 280000, []string{"One Size"}, "Tròng kính polycarbonate chống UV400, gọng hợp kim nhẹ"},
}

// ─── Pool thẻ ngân hàng ───────────────────────────────────────────────────────

var maTheNH = []struct{ ThuongHieu, NganHang, TienTo string }{
	{"Visa", "Vietcombank", "4111"},
	{"Mastercard", "BIDV", "5500"},
	{"Visa", "Techcombank", "4012"},
	{"Mastercard", "MB Bank", "5105"},
	{"Visa", "VPBank", "4222"},
	{"Visa", "Agribank", "4929"},
	{"Mastercard", "ACB", "5425"},
	{"Visa", "TPBank", "4539"},
}

// ─── Helper functions ─────────────────────────────────────────────────────────

func ngauNhienKhoang(rng *rand.Rand, min, max int) int { return min + rng.Intn(max-min+1) }

func lamTronGia(rng *rand.Rand, min, max float64) float64 {
	v := min + rng.Float64()*(max-min)
	return float64(int(v/1000)) * 1000
}

func taoTen(rng *rand.Rand, gioiTinh string) (tenDay, email string) {
	ho := hoViet[rng.Intn(len(hoViet))]
	var dem, ten string
	if gioiTinh == "female" {
		dem = demNu[rng.Intn(len(demNu))]
		ten = tenNu[rng.Intn(len(tenNu))]
	} else {
		dem = demNam[rng.Intn(len(demNam))]
		ten = tenNam[rng.Intn(len(tenNam))]
	}
	tenDay = ho + " " + dem + " " + ten

	// Email không dấu
	emailMap := map[string]string{
		"à": "a", "á": "a", "ả": "a", "ã": "a", "ạ": "a", "ă": "a", "ắ": "a", "ặ": "a", "ằ": "a", "ẵ": "a", "ẳ": "a",
		"â": "a", "ấ": "a", "ầ": "a", "ẩ": "a", "ẫ": "a", "ậ": "a",
		"è": "e", "é": "e", "ẻ": "e", "ẽ": "e", "ẹ": "e", "ê": "e", "ế": "e", "ề": "e", "ể": "e", "ễ": "e", "ệ": "e",
		"ì": "i", "í": "i", "ỉ": "i", "ĩ": "i", "ị": "i",
		"ò": "o", "ó": "o", "ỏ": "o", "õ": "o", "ọ": "o", "ô": "o", "ố": "o", "ồ": "o", "ổ": "o", "ỗ": "o", "ộ": "o",
		"ơ": "o", "ớ": "o", "ờ": "o", "ở": "o", "ỡ": "o", "ợ": "o",
		"ù": "u", "ú": "u", "ủ": "u", "ũ": "u", "ụ": "u", "ư": "u", "ứ": "u", "ừ": "u", "ử": "u", "ữ": "u", "ự": "u",
		"ỳ": "y", "ý": "y", "ỷ": "y", "ỹ": "y", "ỵ": "y",
		"đ": "d",
		"À": "a", "Á": "a", "Â": "a", "Ă": "a", "È": "e", "É": "e", "Ê": "e", "Ì": "i", "Í": "i",
		"Ò": "o", "Ó": "o", "Ô": "o", "Ơ": "o", "Ù": "u", "Ú": "u", "Ư": "u", "Ý": "y", "Đ": "d",
	}
	tenKhongDau := []rune(ten)
	var tenEmail []rune
	for _, c := range tenKhongDau {
		if rep, ok := emailMap[string(c)]; ok {
			tenEmail = append(tenEmail, []rune(rep)...)
		} else {
			tenEmail = append(tenEmail, c)
		}
	}
	hoKhongDau := []rune(ho)
	var hoEmail []rune
	for _, c := range hoKhongDau {
		if rep, ok := emailMap[string(c)]; ok {
			hoEmail = append(hoEmail, []rune(rep)...)
		} else {
			hoEmail = append(hoEmail, c)
		}
	}

	domains := []string{"gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "viettel.vn", "vnpt.vn"}
	emailName := fmt.Sprintf("%s.%s%d",
		strings.ToLower(string(tenEmail)),
		strings.ToLower(string(hoEmail)),
		ngauNhienKhoang(rng, 10, 99),
	)
	email = emailName + "@" + domains[rng.Intn(len(domains))]
	return
}

func taoSDT(rng *rand.Rand) string {
	dauSo := []string{"032", "033", "034", "035", "036", "037", "038", "039", "086", "096", "097", "098", "070", "079", "077", "076", "078", "089", "090", "093"}
	return dauSo[rng.Intn(len(dauSo))] + fmt.Sprintf("%07d", rng.Intn(9999999))
}

func taoCCCD(rng *rand.Rand, prefix string) string {
	return prefix + fmt.Sprintf("%09d", rng.Intn(999999999))
}

func taoThe(rng *rand.Rand) (soThe, chuThe, hanDung, cvv, nganHang string) {
	mau := maTheNH[rng.Intn(len(maTheNH))]
	so := mau.TienTo + fmt.Sprintf("%012d", rng.Int63n(999999999999))
	if len(so) > 16 {
		so = so[:16]
	}
	soThe = so
	nam := 25 + rng.Intn(5)
	thang := 1 + rng.Intn(12)
	hanDung = fmt.Sprintf("%02d/%02d", thang, nam)
	cvv = fmt.Sprintf("%03d", rng.Intn(999)+1)
	nganHang = mau.NganHang
	return
}

func taoNgaySinh(rng *rand.Rand) time.Time {
	nam := 1975 + rng.Intn(33)
	thang := time.Month(1 + rng.Intn(12))
	ngay := 1 + rng.Intn(28)
	return time.Date(nam, thang, ngay, 0, 0, 0, 0, time.UTC)
}

func taoIP(rng *rand.Rand) string {
	pools := []string{"118.70", "171.244", "42.116", "203.113", "27.74", "113.161", "14.162", "210.245", "123.25", "1.55"}
	return fmt.Sprintf("%s.%d.%d", pools[rng.Intn(len(pools))], rng.Intn(254)+1, rng.Intn(254)+1)
}

func chuoiKhongDau(s string) string {
	bangMap := map[rune]string{
		'à': "a", 'á': "a", 'ả': "a", 'ã': "a", 'ạ': "a",
		'ă': "a", 'ắ': "a", 'ặ': "a", 'ằ': "a", 'ẵ': "a", 'ẳ': "a",
		'â': "a", 'ấ': "a", 'ầ': "a", 'ẩ': "a", 'ẫ': "a", 'ậ': "a",
		'è': "e", 'é': "e", 'ẻ': "e", 'ẽ': "e", 'ẹ': "e",
		'ê': "e", 'ế': "e", 'ề': "e", 'ể': "e", 'ễ': "e", 'ệ': "e",
		'ì': "i", 'í': "i", 'ỉ': "i", 'ĩ': "i", 'ị': "i",
		'ò': "o", 'ó': "o", 'ỏ': "o", 'õ': "o", 'ọ': "o",
		'ô': "o", 'ố': "o", 'ồ': "o", 'ổ': "o", 'ỗ': "o", 'ộ': "o",
		'ơ': "o", 'ớ': "o", 'ờ': "o", 'ở': "o", 'ỡ': "o", 'ợ': "o",
		'ù': "u", 'ú': "u", 'ủ': "u", 'ũ': "u", 'ụ': "u",
		'ư': "u", 'ứ': "u", 'ừ': "u", 'ử': "u", 'ữ': "u", 'ự': "u",
		'ỳ': "y", 'ý': "y", 'ỷ': "y", 'ỹ': "y", 'ỵ': "y",
		'đ': "d",
		'À': "a", 'Á': "a", 'Â': "a", 'Ă': "a",
		'È': "e", 'É': "e", 'Ê': "e",
		'Ì': "i", 'Í': "i",
		'Ò': "o", 'Ó': "o", 'Ô': "o", 'Ơ': "o",
		'Ù': "u", 'Ú': "u", 'Ư': "u",
		'Ý': "y", 'Đ': "d",
	}
	var out []rune
	for _, c := range s {
		if rep, ok := bangMap[c]; ok {
			out = append(out, []rune(rep)...)
		} else {
			out = append(out, c)
		}
	}
	return string(out)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

func main() {
	flagReset := flag.Bool("reset", false, "Xóa dữ liệu cũ trước khi insert")
	flagUsers := flag.Int("users", 12, "Số lượng user giả cần tạo")
	flag.Parse()

	// Load .env từ nhiều vị trí khác nhau tùy theo nơi chạy lệnh
	for _, p := range []string{".env", "../.env", "../../.env"} {
		if err := godotenv.Load(p); err == nil {
			break
		}
	}
	mongoURI := "mongodb+srv://xx:xxx@cluster0.ldy9myj.mongodb.net/?appName=Cluster0"
	dbName := "ecommerce"

	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatal("Kết nối MongoDB thất bại:", err)
	}
	defer client.Disconnect(ctx)

	if err := client.Ping(ctx, nil); err != nil {
		log.Fatal("Không ping được MongoDB:", err)
	}
	log.Printf("✓ Kết nối MongoDB: %s / %s\n", mongoURI, dbName)

	db := client.Database(dbName)
	colUsers := db.Collection("users")
	colProducts := db.Collection("products")
	colOrders := db.Collection("orders")
	colShipments := db.Collection("shipments")

	rng := rand.New(rand.NewSource(time.Now().UnixNano()))

	// ── Reset ──────────────────────────────────────────────────────────────────
	if *flagReset {
		log.Println("► Xóa dữ liệu cũ (giữ lại admin)...")
		_, _ = colOrders.DeleteMany(ctx, bson.M{})
		_, _ = colShipments.DeleteMany(ctx, bson.M{})
		_, _ = colProducts.DeleteMany(ctx, bson.M{})
		_, _ = colUsers.DeleteMany(ctx, bson.M{"role": bson.M{"$ne": "admin"}})
		log.Println("  Đã xóa xong.")
	}

	// ── Bước 1: Insert sản phẩm ────────────────────────────────────────────────
	log.Println("\n► Bắt đầu insert sản phẩm...")

	type spInfo struct {
		ID  primitive.ObjectID
		Ten string
		Gia float64
	}
	var dsSanPham []spInfo

	for _, sp := range danhMucSP {
		now := primitive.NewDateTimeFromTime(time.Now())
		gia := lamTronGia(rng, sp.GiaMin, sp.GiaMax)
		tonKho := ngauNhienKhoang(rng, 30, 300)
		giamGia := float64([]int{0, 0, 0, 5, 10, 15, 20}[rng.Intn(7)])
		banChay := rng.Intn(5) == 0

		doc := bson.M{
			"name":         sp.Ten,
			"description":  sp.MoTa,
			"price":        gia,
			"stock":        tonKho,
			"size":         sp.Sizes,
			"category":     sp.DanhMuc,
			"sub_category": sp.DanhMucCon,
			"bestseller":   banChay,
			"images":       bson.A{},
			"discount":     giamGia,
			"category_id":  "",
			"created_at":   now,
			"updated_at":   now,
		}

		res, err := colProducts.InsertOne(ctx, doc)
		if err != nil {
			log.Printf("  Bỏ qua sản phẩm '%s': %v", sp.Ten, err)
			continue
		}
		pid := res.InsertedID.(primitive.ObjectID)
		dsSanPham = append(dsSanPham, spInfo{pid, sp.Ten, gia})
		log.Printf("  + [%s] %-45s %10.0f VND  (kho: %d)", pid.Hex()[:8], sp.Ten, gia, tonKho)
	}
	log.Printf("  → Đã insert %d sản phẩm.\n", len(dsSanPham))

	// ── Bước 2: Insert user + đơn hàng + shipment ──────────────────────────────
	log.Printf("\n► Bắt đầu insert %d user...\n", *flagUsers)

	trangThaiDH := []string{"pending", "shipping", "delivered", "delivered", "delivered"}

	for i := 0; i < *flagUsers; i++ {
		// Chọn giới tính ngẫu nhiên
		gioiTinh := "male"
		gioiTinhHienThi := "Nam"
		if rng.Intn(2) == 0 {
			gioiTinh = "female"
			gioiTinhHienThi = "Nữ"
		}

		tenDay, email := taoTen(rng, gioiTinh)
		sdt := taoSDT(rng)
		tp := cacThanhPho[rng.Intn(len(cacThanhPho))]
		duong := tp.Duong[rng.Intn(len(tp.Duong))]
		quan := tp.Quan[rng.Intn(len(tp.Quan))]
		diaChi := fmt.Sprintf("%d đường %s, %s, %s", ngauNhienKhoang(rng, 1, 120), duong, quan, tp.TenTinh)
		cccd := taoCCCD(rng, tp.MaCCCD)
		ngaySinh := taoNgaySinh(rng)
		soThe, chuThe, hanDung, cvv, nganHang := taoThe(rng)
		matKhauRo := fmt.Sprintf("%s@%d", chuoiKhongDau(strings.Split(tenDay, " ")[len(strings.Split(tenDay, " "))-1]), ngauNhienKhoang(rng, 1000, 9999))
		hash, _ := bcrypt.GenerateFromPassword([]byte(matKhauRo), bcrypt.DefaultCost)

		tgDangKy := time.Now().Add(-time.Duration(ngauNhienKhoang(rng, 30, 730)) * 24 * time.Hour)

		userDoc := models.User{
			Email:       email,
			Password:    string(hash),
			Name:        tenDay,
			Role:        "user",
			CCCD:        cccd,
			Address:     diaChi,
			Phone:       sdt,
			PaymentCard: fmt.Sprintf("**** **** **** %s", soThe[len(soThe)-4:]),
			DateOfBirth: primitive.NewDateTimeFromTime(ngaySinh),
			Gender:      gioiTinh,
			CreatedAt:   primitive.NewDateTimeFromTime(tgDangKy),
			UpdatedAt:   primitive.NewDateTimeFromTime(tgDangKy),
		}

		uRes, err := colUsers.InsertOne(ctx, userDoc)
		if err != nil {
			log.Printf("  [%02d] Bỏ qua user %s (trùng?): %v", i+1, email, err)
			continue
		}
		userID := uRes.InsertedID.(primitive.ObjectID)

		log.Printf("\n  ┌─ [%02d] %s (%s)", i+1, tenDay, gioiTinhHienThi)
		log.Printf("  │  ID: %s", userID.Hex())
		log.Printf("  │  Email: %s  |  Mật khẩu (plain): %s", email, matKhauRo)
		log.Printf("  │  SĐT: %s  |  CCCD: %s  |  Sinh: %s", sdt, cccd, ngaySinh.Format("02/01/2006"))
		log.Printf("  │  Địa chỉ: %s", diaChi)
		log.Printf("  │  Thẻ: %s  |  Ngân hàng: %s  |  CVV: %s  |  HSD: %s", soThe, nganHang, cvv, hanDung)

		// ── Đơn hàng ──────────────────────────────────────────────────────────
		soLuongDH := ngauNhienKhoang(rng, 2, 5)
		log.Printf("  │  → Tạo %d đơn hàng", soLuongDH)

		for j := 0; j < soLuongDH; j++ {
			gioDatHang := ngauNhienKhoang(rng, 1, 720) // 1h - 30 ngày trước
			tgDatHang := time.Now().Add(-time.Duration(gioDatHang) * time.Hour)
			trangThai := trangThaiDH[rng.Intn(len(trangThaiDH))]

			// 1-3 sản phẩm mỗi đơn
			soMon := ngauNhienKhoang(rng, 1, 3)
			var items bson.A
			var tongTien float64
			var tenSPDau string
			daSua := map[int]bool{}

			for k := 0; k < soMon && len(dsSanPham) > 0; k++ {
				idx := rng.Intn(len(dsSanPham))
				for daSua[idx] && len(daSua) < len(dsSanPham) {
					idx = rng.Intn(len(dsSanPham))
				}
				daSua[idx] = true
				sp := dsSanPham[idx]
				soLuong := ngauNhienKhoang(rng, 1, 3)
				items = append(items, bson.M{
					"product_id": sp.ID,
					"name":       sp.Ten,
					"quantity":   soLuong,
					"price":      sp.Gia,
				})
				tongTien += sp.Gia * float64(soLuong)
				if k == 0 {
					tenSPDau = sp.Ten
				}
			}

			orderDoc := bson.M{
				"user_id":    userID,
				"items":      items,
				"total":      tongTien,
				"status":     trangThai,
				"created_at": primitive.NewDateTimeFromTime(tgDatHang),
				"updated_at": primitive.NewDateTimeFromTime(tgDatHang),
			}
			oRes, err := colOrders.InsertOne(ctx, orderDoc)
			if err != nil {
				log.Printf("  │    Lỗi tạo đơn: %v", err)
				continue
			}
			orderID := oRes.InsertedID.(primitive.ObjectID)

			// ── Thanh toán ────────────────────────────────────────────────────
			var ttTT models.PaymentData
			switch rng.Intn(4) {
			case 0: // Thẻ ngân hàng (lỗi PCI-DSS: lưu đầy đủ PAN + CVV)
				ttTT = models.PaymentData{
					Method: "card", Status: "paid", Amount: tongTien,
					TransactionID: fmt.Sprintf("TXN%014d", rng.Int63n(99999999999999)),
					CardNumber:    soThe, CardHolder: chuThe,
					ExpiryDate: hanDung, CVV: cvv, BankName: nganHang,
				}
			case 1: // MoMo
				ttTT = models.PaymentData{
					Method: "momo", Status: "paid", Amount: tongTien,
					TransactionID:  fmt.Sprintf("MM%012d", rng.Int63n(999999999999)),
					WalletPhone:    taoSDT(rng),
					WalletProvider: "momo",
				}
			case 2: // ZaloPay
				ttTT = models.PaymentData{
					Method: "zalopay", Status: "paid", Amount: tongTien,
					TransactionID:  fmt.Sprintf("ZP%012d", rng.Int63n(999999999999)),
					WalletPhone:    sdt,
					WalletProvider: "zalopay",
				}
			default: // COD
				trangThaiCOD := "pending"
				if trangThai == "delivered" {
					trangThaiCOD = "paid"
				}
				ttTT = models.PaymentData{Method: "cod", Status: trangThaiCOD, Amount: tongTien}
			}

			// ── Shipment (lưu toàn bộ PII — lỗ hổng chủ ý) ───────────────────
			shipment := models.Shipment{
				OrderID:      orderID,
				UserID:       userID,
				Status:       trangThai,
				TrackingCode: fmt.Sprintf("VN%010d", rng.Int63n(9999999999)),
				FullName:     tenDay,
				Phone:        sdt,
				Email:        email,
				Address:      diaChi,
				Province:     tp.TenTinh,
				NationalID:   cccd,
				DateOfBirth:  ngaySinh.Format("02/01/2006"),
				PaymentData:  ttTT,
				IPAddress:    taoIP(rng),
				CreatedAt:    primitive.NewDateTimeFromTime(tgDatHang),
				UpdatedAt:    primitive.NewDateTimeFromTime(tgDatHang),
			}

			sRes, err := colShipments.InsertOne(ctx, shipment)
			if err != nil {
				log.Printf("  │    Lỗi tạo shipment: %v", err)
				continue
			}
			shipmentID := sRes.InsertedID.(primitive.ObjectID)

			_, _ = colOrders.UpdateOne(ctx,
				bson.M{"_id": orderID},
				bson.M{"$set": bson.M{"shipment_id": shipmentID}},
			)

			tenSPHienThi := tenSPDau
			if len([]rune(tenSPHienThi)) > 30 {
				tenSPHienThi = string([]rune(tenSPHienThi)[:30]) + "..."
			}
			log.Printf("  │    [%d/%d] %s | %-34s | %9.0f₫ | %-9s | %s",
				j+1, soLuongDH, orderID.Hex()[:10], tenSPHienThi, tongTien, trangThai, ttTT.Method)
		}
		log.Printf("  └─ Hoàn tất user #%02d\n", i+1)
	}

	// ── Tổng kết ────────────────────────────────────────────────────────────────
	totalUsers, _ := colUsers.CountDocuments(ctx, bson.M{"role": "user"})
	totalProducts, _ := colProducts.CountDocuments(ctx, bson.M{})
	totalOrders, _ := colOrders.CountDocuments(ctx, bson.M{})
	totalShipments, _ := colShipments.CountDocuments(ctx, bson.M{})

	log.Printf("\n═══════════════════════════════════════════")
	log.Printf("  Seed hoàn tất!")
	log.Printf("  Users      : %d", totalUsers)
	log.Printf("  Sản phẩm   : %d", totalProducts)
	log.Printf("  Đơn hàng   : %d", totalOrders)
	log.Printf("  Shipments  : %d", totalShipments)
	log.Printf("═══════════════════════════════════════════\n")
}
