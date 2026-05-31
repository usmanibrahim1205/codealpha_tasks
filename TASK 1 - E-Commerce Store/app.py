from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import jwt
import datetime
import os
import uuid
from functools import wraps

app = Flask(__name__, static_folder='public', static_url_path='')
CORS(app)

app.config['SECRET_KEY'] = 'shopvault-super-secret-key-for-jwt-auth-2024-production'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///shopvault.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ─── Models ───────────────────────────────────────────────
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    orders = db.relationship('Order', backref='user', lazy=True)

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(100))
    image = db.Column(db.String(300))
    stock = db.Column(db.Integer, default=100)
    rating = db.Column(db.Float, default=4.5)
    reviews = db.Column(db.Integer, default=0)

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    total = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default='Processing')
    address = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    items = db.relationship('OrderItem', backref='order', lazy=True)

class OrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    product = db.relationship('Product')

class Review(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    user_name = db.Column(db.String(100), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

# ─── Auth Middleware ───────────────────────────────────────
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'Token required'}), 401
        
        # Hardcoded Merchant Token Bypass
        if token == 'shopvault-hardcoded-merchant-token-2026':
            # Create a mock merchant user in memory
            merchant_user = User(id=9999, name="Store Merchant", email="admin")
            return f(merchant_user, *args, **kwargs)
            
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
        except:
            return jsonify({'error': 'Invalid token'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

# ─── Auth Routes ──────────────────────────────────────────
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    if not data or not all(k in data for k in ['name', 'email', 'password']):
        return jsonify({'error': 'Missing fields'}), 400
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 409
    user = User(
        name=data['name'],
        email=data['email'],
        password=generate_password_hash(data['password'])
    )
    db.session.add(user)
    db.session.commit()
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }, app.config['SECRET_KEY'])
    return jsonify({'token': token, 'user': {'id': user.id, 'name': user.name, 'email': user.email}}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    email_or_user = data.get('email')
    password = data.get('password', '')
    
    # Hardcoded Merchant Authentication check
    if email_or_user == 'admin' and password == 'admin@678':
        token = 'shopvault-hardcoded-merchant-token-2026'
        return jsonify({'token': token, 'user': {'id': 9999, 'name': 'Store Merchant', 'email': 'admin', 'isMerchant': True}})
        
    user = User.query.filter_by(email=email_or_user).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({'error': 'Invalid credentials'}), 401
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }, app.config['SECRET_KEY'])
    return jsonify({'token': token, 'user': {'id': user.id, 'name': user.name, 'email': user.email, 'isMerchant': False}})

@app.route('/api/auth/me', methods=['GET'])
@token_required
def me(current_user):
    return jsonify({'id': current_user.id, 'name': current_user.name, 'email': current_user.email})

# ─── Product Routes ───────────────────────────────────────
@app.route('/api/products', methods=['GET'])
def get_products():
    category = request.args.get('category')
    search = request.args.get('search', '')
    query = Product.query
    if category and category != 'all':
        query = query.filter_by(category=category)
    if search:
        query = query.filter(Product.name.ilike(f'%{search}%'))
    products = query.all()
    return jsonify([{
        'id': p.id, 'name': p.name, 'description': p.description,
        'price': p.price, 'category': p.category, 'image': p.image,
        'stock': p.stock, 'rating': p.rating, 'reviews': p.reviews
    } for p in products])

@app.route('/api/products/<int:pid>', methods=['GET'])
def get_product(pid):
    p = Product.query.get_or_404(pid)
    return jsonify({
        'id': p.id, 'name': p.name, 'description': p.description,
        'price': p.price, 'category': p.category, 'image': p.image,
        'stock': p.stock, 'rating': p.rating, 'reviews': p.reviews
    })

# ─── Order Routes ─────────────────────────────────────────
@app.route('/api/orders', methods=['POST'])
@token_required
def create_order(current_user):
    data = request.json
    items = data.get('items', [])
    address = data.get('address', '')
    if not items:
        return jsonify({'error': 'No items'}), 400
    total = 0
    for item in items:
        product = Product.query.get(item['product_id'])
        if not product:
            return jsonify({'error': f'Product {item["product_id"]} not found'}), 404
        total += product.price * item['quantity']
    order = Order(user_id=current_user.id, total=round(total, 2), address=address)
    db.session.add(order)
    db.session.flush()
    for item in items:
        product = Product.query.get(item['product_id'])
        oi = OrderItem(
            order_id=order.id,
            product_id=item['product_id'],
            quantity=item['quantity'],
            price=product.price
        )
        db.session.add(oi)
    db.session.commit()
    return jsonify({'order_id': order.id, 'total': order.total, 'status': order.status}), 201

@app.route('/api/orders/<int:order_id>/cancel', methods=['POST'])
@token_required
def cancel_order(current_user, order_id):
    order = Order.query.filter_by(id=order_id, user_id=current_user.id).first()
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    if order.status != 'Processing':
        return jsonify({'error': f'Cannot cancel an order with status: {order.status}'}), 400
    order.status = 'Cancelled'
    db.session.commit()
    return jsonify({'message': 'Order cancelled', 'order_id': order.id, 'status': order.status})

@app.route('/api/orders', methods=['GET'])
@token_required
def get_orders(current_user):
    orders = Order.query.filter_by(user_id=current_user.id).order_by(Order.created_at.desc()).all()
    result = []
    for o in orders:
        result.append({
            'id': o.id,
            'total': o.total,
            'status': o.status,
            'address': o.address,
            'created_at': o.created_at.isoformat(),
            'items': [{
                'product_id': i.product_id,
                'product_name': i.product.name,
                'quantity': i.quantity,
                'price': i.price,
                'image': i.product.image
            } for i in o.items]
        })
    return jsonify(result)

# ─── Review Routes ────────────────────────────────────────
@app.route('/api/products/<int:pid>/reviews', methods=['GET'])
def get_reviews(pid):
    reviews = Review.query.filter_by(product_id=pid).order_by(Review.created_at.desc()).all()
    return jsonify([{
        'id': r.id,
        'user_name': r.user_name,
        'rating': r.rating,
        'comment': r.comment,
        'created_at': r.created_at.isoformat()
    } for r in reviews])

@app.route('/api/products/<int:pid>/reviews', methods=['POST'])
@token_required
def add_review(current_user, pid):
    p = Product.query.get_or_404(pid)
    data = request.json
    if not data or not data.get('comment') or not data.get('rating'):
        return jsonify({'error': 'Missing rating or comment'}), 400
    
    rating = int(data['rating'])
    if rating < 1 or rating > 5:
        return jsonify({'error': 'Rating must be between 1 and 5'}), 400
        
    review = Review(
        product_id=pid,
        user_name=current_user.name,
        rating=rating,
        comment=data['comment']
    )
    db.session.add(review)
    db.session.commit()
    
    # Recalculate rating & reviews count
    all_reviews = Review.query.filter_by(product_id=pid).all()
    p.reviews = len(all_reviews)
    p.rating = round(sum(r.rating for r in all_reviews) / len(all_reviews), 1)
    db.session.commit()
    
    return jsonify({
        'message': 'Review added successfully',
        'product': {'id': p.id, 'rating': p.rating, 'reviews': p.reviews}
    }), 201

# ─── Admin / Merchant Routes ──────────────────────────────
@app.route('/api/admin/orders', methods=['GET'])
@token_required
def admin_get_orders(current_user):
    orders = Order.query.order_by(Order.created_at.desc()).all()
    result = []
    for o in orders:
        user = User.query.get(o.user_id)
        user_name = user.name if user else "Unknown User"
        user_email = user.email if user else "unknown@example.com"
        result.append({
            'id': o.id,
            'user_name': user_name,
            'user_email': user_email,
            'total': o.total,
            'status': o.status,
            'address': o.address,
            'created_at': o.created_at.isoformat(),
            'items': [{
                'product_id': i.product_id,
                'product_name': i.product.name,
                'quantity': i.quantity,
                'price': i.price,
                'image': i.product.image
            } for i in o.items]
        })
    return jsonify(result)

@app.route('/api/orders/<int:order_id>/status', methods=['PUT'])
@token_required
def admin_update_order_status(current_user, order_id):
    order = Order.query.get_or_404(order_id)
    data = request.json
    status = data.get('status')
    if not status or status not in ['Processing', 'Dispatched', 'Shipped', 'Delivered', 'Cancelled']:
        return jsonify({'error': 'Invalid status'}), 400
    order.status = status
    db.session.commit()
    return jsonify({'message': 'Order status updated', 'order_id': order.id, 'status': order.status})

@app.route('/api/products', methods=['POST'])
@token_required
def admin_create_product(current_user):
    data = request.json
    if not data or not all(k in data for k in ['name', 'price', 'category', 'image', 'stock', 'description']):
        return jsonify({'error': 'Missing product details'}), 400
    
    p = Product(
        name=data['name'],
        description=data['description'],
        price=float(data['price']),
        category=data['category'],
        image=data['image'],
        stock=int(data['stock']),
        rating=5.0,
        reviews=0
    )
    db.session.add(p)
    db.session.commit()
    return jsonify({
        'message': 'Product created successfully',
        'product': {
            'id': p.id, 'name': p.name, 'price': p.price, 'category': p.category,
            'image': p.image, 'stock': p.stock, 'rating': p.rating, 'reviews': p.reviews
        }
    }), 201

@app.route('/api/products/<int:pid>', methods=['PUT'])
@token_required
def admin_update_product(current_user, pid):
    p = Product.query.get_or_404(pid)
    data = request.json
    if not data:
        return jsonify({'error': 'Missing update details'}), 400
        
    if 'name' in data: p.name = data['name']
    if 'description' in data: p.description = data['description']
    if 'price' in data: p.price = float(data['price'])
    if 'category' in data: p.category = data['category']
    if 'image' in data: p.image = data['image']
    if 'stock' in data: p.stock = int(data['stock'])
    
    db.session.commit()
    return jsonify({
        'message': 'Product updated successfully',
        'product': {
            'id': p.id, 'name': p.name, 'price': p.price, 'category': p.category,
            'image': p.image, 'stock': p.stock, 'rating': p.rating, 'reviews': p.reviews
        }
    })

@app.route('/api/products/<int:pid>', methods=['DELETE'])
@token_required
def admin_delete_product(current_user, pid):
    p = Product.query.get_or_404(pid)
    Review.query.filter_by(product_id=pid).delete()
    OrderItem.query.filter_by(product_id=pid).delete()
    db.session.delete(p)
    db.session.commit()
    return jsonify({'message': 'Product deleted successfully', 'product_id': pid})

UPLOAD_FOLDER = os.path.join('public', 'images')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/api/admin/upload-image', methods=['POST'])
@token_required
def admin_upload_image(current_user):
    if 'image' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    filename = secure_filename(file.filename)
    unique_filename = f"{uuid.uuid4().hex}_{filename}"
    file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
    file.save(file_path)
    return jsonify({'image_url': f'/images/{unique_filename}'})

# ─── Serve Frontend ───────────────────────────────────────
@app.route('/')
def index():
    return send_from_directory('public', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('public', path)

# ─── Seed Data ────────────────────────────────────────────
def seed_products():
    if Product.query.count() > 0:
        return
    products = [
        Product(name="Arc Wireless Headphones", description="Premium over-ear headphones with 40-hour battery life, active noise cancellation, and spatial audio. Crafted with memory foam ear cushions and a foldable titanium headband for the ultimate listening experience.", price=299.99, category="Electronics", image="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80", stock=45, rating=4.8, reviews=2341),
        Product(name="Minimal Leather Watch", description="Swiss-made automatic movement with a 42mm brushed stainless steel case. Sapphire crystal glass, 100m water resistance, and a genuine Italian leather strap that ages beautifully.", price=449.00, category="Accessories", image="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80", stock=28, rating=4.9, reviews=876),
        Product(name="Ultrabook Pro 14", description="Ultra-thin laptop featuring a 14-inch OLED display with 2.8K resolution, Intel Core i7 processor, 16GB LPDDR5 RAM, and 1TB NVMe SSD. All-day battery with 12 hours of real-world use.", price=1299.00, category="Electronics", image="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80", stock=15, rating=4.7, reviews=543),
        Product(name="Merino Wool Sweater", description="100% superfine Merino wool from New Zealand. Temperature-regulating, naturally odor-resistant, and machine washable. Available in a refined palette of earth tones and neutrals.", price=189.00, category="Clothing", image="https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80", stock=60, rating=4.6, reviews=1205),
        Product(name="Ceramic Pour-Over Set", description="Handcrafted ceramic pour-over coffee dripper with matching carafe and stand. Each piece is wheel-thrown and finished with a matte glaze. Includes precision-cut filters.", price=89.00, category="Home", image="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80", stock=82, rating=4.8, reviews=654),
        Product(name="Running Shoes Elite", description="Engineered mesh upper with dynamic support zones. Carbon fiber plate in the midsole delivers explosive energy return. Perfect for race day and long training runs.", price=219.99, category="Sports", image="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80", stock=35, rating=4.5, reviews=3210),
        Product(name="Smart Home Hub", description="Central control for all your smart devices. Compatible with 10,000+ devices from 500+ brands. Built-in Zigbee, Z-Wave, Thread, and Matter protocols for maximum compatibility.", price=149.00, category="Electronics", image="https://images.unsplash.com/photo-1558002038-1055907df827?w=600&q=80", stock=55, rating=4.4, reviews=987),
        Product(name="Linen Throw Blanket", description="Woven from pre-washed European linen for immediate softness. Stone-washed finish gives a relaxed, lived-in texture. Generously sized at 60×80 inches with fringe detail.", price=129.00, category="Home", image="https://images.unsplash.com/photo-1631249551990-197c06cf6688?w=600&q=80", stock=40, rating=4.7, reviews=432),
        Product(name="Titanium Fountain Pen", description="CNC-machined from aerospace-grade titanium. Features a hand-tuned 18K gold nib with three flex settings. Cartridge and converter compatible with worldwide ink standards.", price=349.00, category="Accessories", image="https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&q=80", stock=22, rating=4.9, reviews=321),
        Product(name="Yoga Mat Pro", description="6mm natural rubber base with antimicrobial microfiber top surface. 72 inches long, non-slip even when wet. Comes with carrying strap and alignment guides printed in subtle tone-on-tone.", price=98.00, category="Sports", image="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80", stock=70, rating=4.6, reviews=1876),
        Product(name="Silk Scarf", description="100% mulberry silk, 90×90cm. Hand-rolled edges and printed with an original archival design. Each scarf is individually numbered and comes with a certificate of authenticity.", price=245.00, category="Clothing", image="https://images.unsplash.com/photo-1601370552761-8a3add32ab7e?w=600&q=80", stock=18, rating=4.8, reviews=234),
        Product(name="Mechanical Keyboard", description="75% layout with hot-swappable PCB. Gasket-mounted for that premium typing feel. Pre-lubed linear switches, RGB per-key illumination, and aircraft aluminum case.", price=179.00, category="Electronics", image="https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80", stock=30, rating=4.7, reviews=1543),
    ]
    for p in products:
        db.session.add(p)
    db.session.commit()
    print("OK: Seeded 12 products")

def seed_reviews():
    if Review.query.count() > 0:
        return
    dummy_reviews = [
        ("Sophia Loren", 5, "Absolutely beautiful! The audio separation is incredible and the noise cancellation is gold standard. Highly recommend!"),
        ("Jackson Wright", 4, "Extremely comfortable and long battery life. The treble is a bit bright out of the box but smooths out over time."),
        ("Emma Stone", 5, "Craftsmanship is pure elegance. Holds time flawlessly and the leather strap smells amazing."),
        ("Liam Neeson", 4, "A sturdy and reliable automatic watch. Sapphire crystal handles daily scrapes with ease."),
        ("Olivia Wilde", 5, "Unbelievably sharp screen! Fast compile times and super lightweight. Best purchase of the year."),
        ("Lucas M.", 3, "Decent machine, but the fan runs a little loud under heavy load. Still, great display."),
        ("Aria Vance", 5, "So warm and soft, the quality is exceptional. Drapes perfectly and regulates temperature nicely."),
        ("Ethan Hunt", 5, "Handmade rustic look that adds so much charm to the coffee table. Dripper works perfectly."),
        ("Chloe Bennett", 4, "Beautiful dripper, but clean with care as the ceramic is delicate. Overall, very satisfied."),
        ("Noah Miller", 5, "Incredible energy return! Shaved two minutes off my 5k. Highly cushioned yet stable."),
        ("Zoe Saldana", 5, "The hub acts as a flawless brain for all smart appliances. Zero latency and super easy pairing."),
        ("Mason Mount", 4, "Soft, thick linen throw that is highly breathable. Perfect for warm summer nights on the patio."),
        ("Lily Evans", 5, "A premium writing instrument. Ergonomics of titanium combined with a flex nib makes writing pure joy."),
        ("William Shakes", 5, "Flow of ink is consistent and writing lines are highly crisp. Worth every penny."),
        ("David G.", 4, "Natural rubber provides ultimate grip. Does not slip even during intense hot yoga sessions."),
        ("Charlotte R.", 5, "The design is a true masterpiece. Silk feels incredibly luxurious and colors are deeply rich."),
        ("Alex Mercer", 5, "Typing feel is extremely premium with high-quality acoustics. Love the customizable RGB profiles.")
    ]
    
    products = Product.query.all()
    import random
    random.seed(42)
    
    for p in products:
        num_revs = random.randint(2, 3)
        product_reviews = random.sample(dummy_reviews, num_revs)
        total_rating = 0
        for name, rating, comment in product_reviews:
            rev = Review(product_id=p.id, user_name=name, rating=rating, comment=comment)
            db.session.add(rev)
            total_rating += rating
        p.reviews = num_revs
        p.rating = round(total_rating / num_revs, 1)
        
    db.session.commit()
    print("OK: Seeded customer reviews")

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        seed_products()
        seed_reviews()
    app.run(debug=True, port=5000)
