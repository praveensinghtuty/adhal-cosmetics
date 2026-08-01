export const TAMIL_NADU_CITIES = [
  "Ambasamudram", "Ambattur", "Ambur", "Arakkonam", "Arani", "Ariyalur",
  "Aruppukkottai", "Attur", "Avadi", "Bhavani", "Bodinayakanur", "Chengalpattu",
  "Chennai", "Chidambaram", "Coimbatore", "Coonoor", "Cuddalore", "Devakottai",
  "Dharapuram", "Dharmapuri", "Dindigul", "Erode", "Gobichettipalayam", "Gudalur",
  "Gudiyatham", "Hosur", "Jayankondam", "Kallakurichi", "Kanchipuram", "Kangeyam",
  "Karaikudi", "Karur", "Kodaikanal", "Kovilpatti", "Krishnagiri", "Kumbakonam",
  "Madurai", "Mayiladuthurai", "Mettupalayam", "Mettur", "Nagapattinam", "Nagercoil",
  "Namakkal", "Neyveli", "Nilgiris", "Oddanchatram", "Ooty", "Palani",
  "Palladam", "Pallavaram", "Panruti", "Paramakudi", "Perambalur", "Periyakulam",
  "Pollachi", "Pudukkottai", "Rajapalayam", "Ramanathapuram", "Rameswaram", "Ranipet",
  "Salem", "Sankarankovil", "Sathyamangalam", "Sivagangai", "Sivakasi", "Sriperumbudur",
  "Tambaram", "Tenkasi", "Thanjavur", "Theni", "Thirumangalam", "Thiruvallur",
  "Thiruvarur", "Thoothukudi", "Tindivanam", "Tiruchengode", "Tiruchirappalli",
  "Tirunelveli", "Tirupattur", "Tiruppur", "Tiruttani", "Tiruvannamalai", "Udhagamandalam",
  "Udumalaipettai", "Vaniyambadi", "Vellore", "Viluppuram", "Virudhunagar",
] as const;

export const isTamilNaduCity = (value: string) =>
  TAMIL_NADU_CITIES.some((city) => city.toLowerCase() === value.trim().toLowerCase());
