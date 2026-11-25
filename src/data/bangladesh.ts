export interface DivisionData {
  name: string;
  districts: {
    name: string;
    upazilas: string[];
  }[];
}

export const BANGLADESH_DIVISIONS: DivisionData[] = [
  {
    name: 'Dhaka',
    districts: [
      {
        name: 'Dhaka Metro',
        upazilas: [
          'Dhanmondi',
          'Gulshan',
          'Banani',
          'Mirpur',
          'Uttara',
          'Mohammadpur',
          'Motijheel',
          'Bashundhara R/A',
          'Badda',
          'Khilgaon',
        ],
      },
      {
        name: 'Dhaka Suburbs',
        upazilas: ['Savar', 'Keraniganj', 'Dhamrai', 'Ashulia'],
      },
      {
        name: 'Gazipur',
        upazilas: ['Gazipur Sadar', 'Tongi', 'Kaliakoir', 'Sreepur'],
      },
      {
        name: 'Narayanganj',
        upazilas: ['Narayanganj Sadar', 'Fatullah', 'Siddhirganj', 'Rupganj'],
      },
    ],
  },
  {
    name: 'Chattogram',
    districts: [
      {
        name: 'Chattogram',
        upazilas: ['Kotwali', 'Panchlaish', 'Halishahar', 'Agrabad', 'Nasirabad', 'Patenga'],
      },
      {
        name: "Cox's Bazar",
        upazilas: ["Cox's Bazar Sadar", 'Teknaf', 'Chakaria', 'Ukhiya'],
      },
      {
        name: 'Cumilla',
        upazilas: ['Cumilla Sadar', 'Kotbari', 'Daudkandi', 'Laksam'],
      },
    ],
  },
  {
    name: 'Sylhet',
    districts: [
      {
        name: 'Sylhet',
        upazilas: ['Sylhet Sadar', 'Kumargaon', 'Zindabazar', 'Amberkhana', 'Beanibazar'],
      },
      {
        name: 'Moulvibazar',
        upazilas: ['Moulvibazar Sadar', 'Sreemangal', 'Kulaura'],
      },
    ],
  },
  {
    name: 'Rajshahi',
    districts: [
      {
        name: 'Rajshahi',
        upazilas: ['Boalia', 'Motihar', 'Rajpara', 'Shah Makhdum'],
      },
      {
        name: 'Bogura',
        upazilas: ['Bogura Sadar', 'Sherpur', 'Shibganj'],
      },
    ],
  },
  {
    name: 'Khulna',
    districts: [
      {
        name: 'Khulna',
        upazilas: ['Sonadanga', 'Khalishpur', 'Daulatpur', 'Khulna Sadar'],
      },
      {
        name: 'Jashore',
        upazilas: ['Jashore Sadar', 'Benapole', 'Jhikargacha'],
      },
    ],
  },
  {
    name: 'Barishal',
    districts: [
      {
        name: 'Barishal',
        upazilas: ['Barishal Sadar', 'Bakerganj', 'Banaripara'],
      },
    ],
  },
  {
    name: 'Rangpur',
    districts: [
      {
        name: 'Rangpur',
        upazilas: ['Rangpur Sadar', 'Mithapukur', 'Pirganj'],
      },
    ],
  },
  {
    name: 'Mymensingh',
    districts: [
      {
        name: 'Mymensingh',
        upazilas: ['Mymensingh Sadar', 'Trishal', 'Bhaluka'],
      },
    ],
  },
];
