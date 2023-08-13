const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');
router.get('/', async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [
        { model: Category },
        { model: Tag, through: ProductTag },
      ],
    });
    res.json(products);
  } catch (err) {
    res.status(500).json(err);
  }
});
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: Category },
        { model: Tag, through: ProductTag },
      ],
    });
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    res.json(product);
  } catch (err) {
    res.status(500).json(err);
  }
});
router.post('/', async (req, res) => {
  try {
    const newProduct = await Product.create(req.body);

    if (req.body.tagIds && req.body.tagIds.length) {
      const productTagIdArr = req.body.tagIds.map((tag_id) => ({
        product_id: newProduct.id,
        tag_id,
      }));
      await ProductTag.bulkCreate(productTagIdArr);
    }
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json(err);
  }
});
router.put('/:id', async (req, res) => {
  try {
    const [affectedRows] = await Product.update(req.body, {
      where: { id: req.params.id },
    });
    if (affectedRows === 0) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    if (req.body.tagIds && req.body.tagIds.length) {
      const productTags = await ProductTag.findAll({
        where: { product_id: req.params.id },
      });
      const existingTagIds = productTags.map(({ tag_id }) => tag_id);
      const newTagIds = req.body.tagIds.filter((tag_id) => !existingTagIds.includes(tag_id));
      await Promise.all([
        ProductTag.destroy({ where: { id: productTags.map(({ id }) => id) } }),
        ProductTag.bulkCreate(newTagIds.map((tag_id) => ({
          product_id: req.params.id,
          tag_id,
        }))),
      ]);
    }
    res.status(200).json({ message: 'Product updated' });
  } catch (err) {
    res.status(400).json(err);
  }
});
router.delete('/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.destroy({
      where: { id: req.params.id },
    });
    if (!deletedProduct) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    res.status(200).json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json(err);
  }
});
module.exports = router;
